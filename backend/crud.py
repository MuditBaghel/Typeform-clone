import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas

def generate_short_slug():
    return str(uuid.uuid4())[:8]

def get_forms(db: Session) -> List[models.Form]:
    forms = db.query(models.Form).order_by(models.Form.updated_at.desc()).all()
    for f in forms:
        f.response_count = db.query(models.Response).filter(models.Response.form_id == f.id).count()
    return forms

def get_form(db: Session, form_id: str) -> Optional[models.Form]:
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if form:
        form.response_count = db.query(models.Response).filter(models.Response.form_id == form_id).count()
    return form

def get_form_by_slug(db: Session, slug: str) -> Optional[models.Form]:
    form = db.query(models.Form).filter(models.Form.slug == slug).first()
    if form:
        form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
    return form

def create_form(db: Session, form_in: schemas.FormCreate) -> models.Form:
    slug = form_in.slug or generate_short_slug()
    db_form = models.Form(
        title=form_in.title,
        description=form_in.description,
        status=form_in.status or "draft",
        slug=slug,
        theme=form_in.theme.dict() if form_in.theme else None,
        welcome_enabled=form_in.welcome_enabled if form_in.welcome_enabled is not None else True,
        welcome_title=form_in.welcome_title or "Welcome!",
        welcome_description=form_in.welcome_description or "Please take a minute to answer these questions.",
        welcome_button_text=form_in.welcome_button_text or "Start Form",
        thank_you_title=form_in.thank_you_title or "Thank you for taking the time!",
        thank_you_description=form_in.thank_you_description or "Your responses have been recorded.",
        thank_you_button_text=form_in.thank_you_button_text or "Submit another response",
        thank_you_button_url=form_in.thank_you_button_url or "",
    )
    db.add(db_form)
    db.commit()
    db.refresh(db_form)

    if form_in.questions:
        for idx, q in enumerate(form_in.questions):
            db_q = models.Question(
                id=q.id or str(uuid.uuid4()),
                form_id=db_form.id,
                type=q.type,
                title=q.title,
                description=q.description,
                required=q.required,
                order=idx,
                options=q.options,
                logic=q.logic,
            )
            db.add(db_q)
        db.commit()
        db.refresh(db_form)

    db_form.response_count = 0
    return db_form

def update_form(db: Session, form_id: str, form_in: schemas.FormUpdate) -> Optional[models.Form]:
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        return None

    if form_in.title is not None:
        db_form.title = form_in.title
    if form_in.description is not None:
        db_form.description = form_in.description
    if form_in.status is not None:
        db_form.status = form_in.status
    if form_in.theme is not None:
        db_form.theme = form_in.theme.dict()

    if form_in.welcome_enabled is not None:
        db_form.welcome_enabled = form_in.welcome_enabled
    if form_in.welcome_title is not None:
        db_form.welcome_title = form_in.welcome_title
    if form_in.welcome_description is not None:
        db_form.welcome_description = form_in.welcome_description
    if form_in.welcome_button_text is not None:
        db_form.welcome_button_text = form_in.welcome_button_text

    if form_in.thank_you_title is not None:
        db_form.thank_you_title = form_in.thank_you_title
    if form_in.thank_you_description is not None:
        db_form.thank_you_description = form_in.thank_you_description
    if form_in.thank_you_button_text is not None:
        db_form.thank_you_button_text = form_in.thank_you_button_text
    if form_in.thank_you_button_url is not None:
        db_form.thank_you_button_url = form_in.thank_you_button_url

    if form_in.questions is not None:
        db.query(models.Question).filter(models.Question.form_id == form_id).delete()
        for idx, q in enumerate(form_in.questions):
            db_q = models.Question(
                id=q.id or str(uuid.uuid4()),
                form_id=form_id,
                type=q.type,
                title=q.title,
                description=q.description,
                required=q.required,
                order=idx,
                options=q.options,
                logic=q.logic,
            )
            db.add(db_q)

    db.commit()
    db.refresh(db_form)
    db_form.response_count = db.query(models.Response).filter(models.Response.form_id == form_id).count()
    return db_form

def delete_form(db: Session, form_id: str) -> bool:
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        return False
    db.delete(db_form)
    db.commit()
    return True

def duplicate_form(db: Session, form_id: str) -> Optional[models.Form]:
    source_form = get_form(db, form_id)
    if not source_form:
        return None

    new_slug = generate_short_slug()
    new_form = models.Form(
        title=f"{source_form.title} (Copy)",
        description=source_form.description,
        status="draft",
        slug=new_slug,
        theme=source_form.theme,
        welcome_enabled=source_form.welcome_enabled,
        welcome_title=source_form.welcome_title,
        welcome_description=source_form.welcome_description,
        welcome_button_text=source_form.welcome_button_text,
        thank_you_title=source_form.thank_you_title,
        thank_you_description=source_form.thank_you_description,
        thank_you_button_text=source_form.thank_you_button_text,
        thank_you_button_url=source_form.thank_you_button_url,
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)

    for q in source_form.questions:
        db_q = models.Question(
            id=str(uuid.uuid4()),
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            order=q.order,
            options=q.options,
            logic=q.logic,
        )
        db.add(db_q)

    db.commit()
    db.refresh(new_form)
    new_form.response_count = 0
    return new_form

def create_response(db: Session, form_id: str, resp_in: schemas.ResponseCreate) -> models.Response:
    db_resp = models.Response(
        id=str(uuid.uuid4()),
        form_id=form_id,
        answers=resp_in.answers,
    )
    db.add(db_resp)
    db.commit()
    db.refresh(db_resp)
    return db_resp

def get_form_responses(db: Session, form_id: str) -> List[models.Response]:
    return db.query(models.Response).filter(models.Response.form_id == form_id).order_by(models.Response.submitted_at.desc()).all()

def get_form_stats(db: Session, form_id: str) -> Dict[str, Any]:
    form = get_form(db, form_id)
    if not form:
        return {"total_responses": 0, "question_stats": []}

    responses = get_form_responses(db, form_id)
    total_responses = len(responses)

    stats_list = []
    for q in form.questions:
        stat = {
            "question_id": q.id,
            "title": q.title,
            "type": q.type,
            "total_answers": 0,
            "option_counts": {},
            "text_samples": [],
            "average_rating": None
        }

        answers = [r.answers.get(q.id) for r in responses if q.id in r.answers and r.answers.get(q.id) not in (None, "")]
        stat["total_answers"] = len(answers)

        if q.type in ["multiple_choice", "dropdown", "yes_no"]:
            counts = {}
            if q.options and isinstance(q.options, list):
                for opt in q.options:
                    counts[str(opt)] = 0
            if q.type == "yes_no":
                counts["Yes"] = 0
                counts["No"] = 0

            for ans in answers:
                str_ans = str(ans)
                counts[str_ans] = counts.get(str_ans, 0) + 1
            stat["option_counts"] = counts

        elif q.type == "rating":
            num_answers = []
            counts = {str(i): 0 for i in range(1, 6)}
            for ans in answers:
                try:
                    val = int(ans)
                    counts[str(val)] = counts.get(str(val), 0) + 1
                    num_answers.append(val)
                except (ValueError, TypeError):
                    pass
            stat["option_counts"] = counts
            if num_answers:
                stat["average_rating"] = round(sum(num_answers) / len(num_answers), 2)

        elif q.type in ["short_text", "long_text", "email", "number"]:
            stat["text_samples"] = [str(ans) for ans in answers[:10]]
            if q.type == "number":
                nums = []
                for ans in answers:
                    try:
                        nums.append(float(ans))
                    except (ValueError, TypeError):
                        pass
                if nums:
                    stat["average_rating"] = round(sum(nums) / len(nums), 2)

        stats_list.append(stat)

    return {
        "total_responses": total_responses,
        "question_stats": stats_list
    }
