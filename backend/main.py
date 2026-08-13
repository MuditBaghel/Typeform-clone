import csv
import io
from fastapi import FastAPI, Depends, HTTPException, Response as FastAPIResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import engine, get_db

Base = models.Base
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    # Seed if database is empty
    if db.query(models.Form).count() == 0:
        from seed import seed_data
        seed_data()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Typeform Clone API"}

# --- Form CRUD ---

@app.get("/api/forms", response_model=List[schemas.FormOut])
def list_forms(db: Session = Depends(get_db)):
    return crud.get_forms(db)

@app.post("/api/forms", response_model=schemas.FormOut)
def create_form(form_in: schemas.FormCreate, db: Session = Depends(get_db)):
    return crud.create_form(db, form_in)

@app.get("/api/forms/{form_id}", response_model=schemas.FormOut)
def get_form(form_id: str, db: Session = Depends(get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@app.put("/api/forms/{form_id}", response_model=schemas.FormOut)
def update_form(form_id: str, form_in: schemas.FormUpdate, db: Session = Depends(get_db)):
    form = crud.update_form(db, form_id, form_in)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@app.delete("/api/forms/{form_id}")
def delete_form(form_id: str, db: Session = Depends(get_db)):
    success = crud.delete_form(db, form_id)
    if not success:
        raise HTTPException(status_code=404, detail="Form not found")
    return {"message": "Form deleted successfully"}

@app.post("/api/forms/{form_id}/duplicate", response_model=schemas.FormOut)
def duplicate_form(form_id: str, db: Session = Depends(get_db)):
    form = crud.duplicate_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Source form not found")
    return form

# --- Public Respondent API ---

@app.get("/api/public/forms/{slug}", response_model=schemas.FormOut)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    form = crud.get_form_by_slug(db, slug)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.status != "published":
        raise HTTPException(status_code=403, detail="Form is not published")
    return form

@app.post("/api/public/forms/{slug}/submit", response_model=schemas.ResponseOut)
def submit_public_response(slug: str, resp_in: schemas.ResponseCreate, db: Session = Depends(get_db)):
    form = crud.get_form_by_slug(db, slug)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.status != "published":
        raise HTTPException(status_code=403, detail="Form is not published")

    # Validate required fields & email format
    for q in form.questions:
        ans = resp_in.answers.get(q.id)
        if q.required and (ans is None or str(ans).strip() == ""):
            raise HTTPException(status_code=400, detail=f"Question '{q.title}' is required.")
        if q.type == "email" and ans:
            if "@" not in str(ans) or "." not in str(ans):
                raise HTTPException(status_code=400, detail=f"Invalid email address for '{q.title}'.")
        if q.type == "number" and ans is not None and str(ans).strip() != "":
            try:
                float(ans)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid number for '{q.title}'.")

    return crud.create_response(db, form.id, resp_in)

# --- Results & Analytics ---

@app.get("/api/forms/{form_id}/responses", response_model=List[schemas.ResponseOut])
def get_form_responses(form_id: str, db: Session = Depends(get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.get_form_responses(db, form_id)

@app.get("/api/forms/{form_id}/stats", response_model=schemas.FormStatsOut)
def get_form_stats(form_id: str, db: Session = Depends(get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.get_form_stats(db, form_id)

@app.get("/api/forms/{form_id}/export/csv")
def export_responses_csv(form_id: str, db: Session = Depends(get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    responses = crud.get_form_responses(db, form_id)

    output = io.StringIO()
    writer = csv.writer(output)

    # Headers: Response ID, Submitted At, Question 1, Question 2...
    header = ["Response ID", "Submitted At"] + [q.title for q in form.questions]
    writer.writerow(header)

    for r in responses:
        row = [r.id, r.submitted_at.isoformat()]
        for q in form.questions:
            ans = r.answers.get(q.id, "")
            row.append(str(ans) if ans is not None else "")
        writer.writerow(row)

    output.seek(0)
    filename = f"{form.title.replace(' ', '_').lower()}_responses.csv"
    return FastAPIResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
