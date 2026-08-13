from database import SessionLocal, engine, Base
import models
import uuid

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(models.Response).delete()
    db.query(models.Question).delete()
    db.query(models.Form).delete()
    db.commit()

    # Seed Form 1: Product Feedback Survey
    form1_id = str(uuid.uuid4())
    form1 = models.Form(
        id=form1_id,
        title="Product Feedback Survey 2026",
        description="We'd love to hear your feedback to help us improve our platform.",
        status="published",
        slug="product-feedback-2026",
        theme={
            "backgroundColor": "#191919",
            "textColor": "#FFFFFF",
            "buttonColor": "#0445AF",
            "buttonTextColor": "#FFFFFF",
            "questionTextColor": "#FFFFFF",
            "answerTextColor": "#367EE9",
            "fontFamily": "Inter"
        },
        thank_you_title="Thank you for your feedback!",
        thank_you_description="Your insights directly shape our roadmap. Have a great day!"
    )
    db.add(form1)
    db.commit()

    q1_1 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        type="short_text",
        title="What is your name?",
        description="First name or full name is fine.",
        required=True,
        order=0
    )
    q1_2 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        type="email",
        title="What is your email address?",
        description="We'll only reach out if you ask us to follow up.",
        required=True,
        order=1
    )
    q1_3 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        type="rating",
        title="How satisfied are you with our web application overall?",
        description="Rate from 1 (Very Dissatisfied) to 5 (Extremely Satisfied).",
        required=True,
        order=2,
        options=[1, 2, 3, 4, 5]
    )
    q1_4 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        type="multiple_choice",
        title="Which feature do you use most frequently?",
        description="Select the primary feature you rely on daily.",
        required=True,
        order=3,
        options=["Drag & Drop Form Builder", "Live Preview", "1-Question Respondent Flow", "Analytics & CSV Export"]
    )
    q1_5 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        type="yes_no",
        title="Would you recommend our tool to a colleague or friend?",
        description="Be honest, we appreciate real feedback!",
        required=True,
        order=4
    )
    q1_6 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        type="long_text",
        title="Any additional suggestions or features you'd like to see?",
        description="Feel free to detail any bugs, ideas, or improvements.",
        required=False,
        order=5
    )

    db.add_all([q1_1, q1_2, q1_3, q1_4, q1_5, q1_6])
    db.commit()

    # Seed responses for Form 1
    resp1_1 = models.Response(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        answers={
            q1_1.id: "Alice Johnson",
            q1_2.id: "alice@example.com",
            q1_3.id: 5,
            q1_4.id: "1-Question Respondent Flow",
            q1_5.id: "Yes",
            q1_6.id: "The animation effects are incredibly smooth! Would love AI builder prompts."
        }
    )
    resp1_2 = models.Response(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        answers={
            q1_1.id: "Bob Smith",
            q1_2.id: "bob@techcorp.io",
            q1_3.id: 4,
            q1_4.id: "Drag & Drop Form Builder",
            q1_5.id: "Yes",
            q1_6.id: "Great builder UI. Would like file upload question support."
        }
    )
    resp1_3 = models.Response(
        id=str(uuid.uuid4()),
        form_id=form1_id,
        answers={
            q1_1.id: "Carol Davis",
            q1_2.id: "carol@design.co",
            q1_3.id: 5,
            q1_4.id: "Analytics & CSV Export",
            q1_5.id: "Yes",
            q1_6.id: "Love the dark theme support."
        }
    )
    db.add_all([resp1_1, resp1_2, resp1_3])

    # Seed Form 2: Event Registration Form
    form2_id = str(uuid.uuid4())
    form2 = models.Form(
        id=form2_id,
        title="Typeform Tech Summit 2026 Registration",
        description="Join us for inspiring keynotes and interactive workshops.",
        status="published",
        slug="tech-summit-2026",
        theme={
            "backgroundColor": "#0F172A",
            "textColor": "#F8FAFC",
            "buttonColor": "#6366F1",
            "buttonTextColor": "#FFFFFF",
            "questionTextColor": "#F8FAFC",
            "answerTextColor": "#818CF8",
            "fontFamily": "Inter"
        },
        thank_you_title="Registration Confirmed!",
        thank_you_description="Check your inbox for event details and calendar invite."
    )
    db.add(form2)
    db.commit()

    q2_1 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form2_id,
        type="short_text",
        title="Full Name",
        description="Name as it should appear on your summit badge.",
        required=True,
        order=0
    )
    q2_2 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form2_id,
        type="dropdown",
        title="Which track are you most interested in?",
        description="Choose your primary track.",
        required=True,
        order=1,
        options=["Frontend & UX Innovations", "Backend Architecture & AI", "Product & Design Thinking", "Cloud & DevOps"]
    )
    q2_3 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form2_id,
        type="yes_no",
        title="Will you be attending the networking dinner?",
        description="Complimentary food and drinks provided.",
        required=True,
        order=2
    )
    q2_4 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form2_id,
        type="number",
        title="How many team members will join with you?",
        description="Enter number (0 for solo).",
        required=False,
        order=3
    )

    db.add_all([q2_1, q2_2, q2_3, q2_4])
    db.commit()

    resp2_1 = models.Response(
        id=str(uuid.uuid4()),
        form_id=form2_id,
        answers={
            q2_1.id: "David Miller",
            q2_2.id: "Frontend & UX Innovations",
            q2_3.id: "Yes",
            q2_4.id: 3
        }
    )
    db.add(resp2_1)

    # Seed Form 3: Draft Job Application
    form3_id = str(uuid.uuid4())
    form3 = models.Form(
        id=form3_id,
        title="Senior Fullstack Engineer Application",
        description="Apply to join our core product engineering team.",
        status="draft",
        slug="engineer-application",
        theme={
            "backgroundColor": "#FFFFFF",
            "textColor": "#0F172A",
            "buttonColor": "#0284C7",
            "buttonTextColor": "#FFFFFF",
            "questionTextColor": "#0F172A",
            "answerTextColor": "#0284C7",
            "fontFamily": "Inter"
        },
        thank_you_title="Application Received",
        thank_you_description="Our hiring team will review your application and respond within 3 business days."
    )
    db.add(form3)
    db.commit()

    q3_1 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form3_id,
        type="short_text",
        title="Your Full Name",
        description="",
        required=True,
        order=0
    )
    q3_2 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form3_id,
        type="email",
        title="Email Address",
        description="",
        required=True,
        order=1
    )
    q3_3 = models.Question(
        id=str(uuid.uuid4()),
        form_id=form3_id,
        type="short_text",
        title="LinkedIn or GitHub Profile URL",
        description="",
        required=True,
        order=2
    )

    db.add_all([q3_1, q3_2, q3_3])
    db.commit()

    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
