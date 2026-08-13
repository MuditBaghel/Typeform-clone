import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Form(Base):
    __tablename__ = "forms"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False, default="Untitled Form")
    description = Column(String, nullable=True, default="")
    status = Column(String, nullable=False, default="draft")  # draft | published
    slug = Column(String, unique=True, index=True, nullable=False)
    theme = Column(JSON, nullable=True, default=lambda: {
        "backgroundColor": "#191919",
        "textColor": "#FFFFFF",
        "buttonColor": "#0445AF",
        "buttonTextColor": "#FFFFFF",
        "questionTextColor": "#FFFFFF",
        "answerTextColor": "#367EE9",
        "fontFamily": "Inter"
    })

    # Welcome screen
    welcome_enabled = Column(Boolean, default=True)
    welcome_title = Column(String, nullable=True, default="Welcome!")
    welcome_description = Column(String, nullable=True, default="Please take a minute to answer these questions.")
    welcome_button_text = Column(String, nullable=True, default="Start Form")

    # Thank you screen
    thank_you_title = Column(String, nullable=False, default="Thank you for taking the time!")
    thank_you_description = Column(String, nullable=True, default="Your responses have been recorded.")
    thank_you_button_text = Column(String, nullable=True, default="Submit another response")
    thank_you_button_url = Column(String, nullable=True, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan", order_by="Question.order")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    form_id = Column(String, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # short_text, long_text, multiple_choice, dropdown, email, number, yes_no, rating
    title = Column(String, nullable=False, default="Untitled Question")
    description = Column(String, nullable=True, default="")
    required = Column(Boolean, default=False)
    order = Column(Integer, nullable=False, default=0)
    options = Column(JSON, nullable=True, default=list)  # list of strings or dicts
    logic = Column(JSON, nullable=True, default=list)    # list of condition rules: [{ifValue: 'Yes', goToQuestionId: 'id'}]

    form = relationship("Form", back_populates="questions")

class Response(Base):
    __tablename__ = "responses"

    id = Column(String, primary_key=True, default=generate_uuid)
    form_id = Column(String, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    answers = Column(JSON, nullable=False, default=dict)  # {question_id: answer_value}
    submitted_at = Column(DateTime, default=datetime.utcnow)

    form = relationship("Form", back_populates="responses")
