from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class QuestionBase(BaseModel):
    type: str
    title: str = "Untitled Question"
    description: Optional[str] = ""
    required: bool = False
    order: int = 0
    options: Optional[List[Any]] = []
    logic: Optional[List[Dict[str, Any]]] = []

class QuestionCreate(QuestionBase):
    id: Optional[str] = None

class QuestionUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    order: Optional[int] = None
    options: Optional[List[Any]] = None
    logic: Optional[List[Dict[str, Any]]] = None

class QuestionOut(QuestionBase):
    id: str
    form_id: str

    class Config:
        from_attributes = True

class ThemeSchema(BaseModel):
    backgroundColor: Optional[str] = "#191919"
    textColor: Optional[str] = "#FFFFFF"
    buttonColor: Optional[str] = "#0445AF"
    buttonTextColor: Optional[str] = "#FFFFFF"
    questionTextColor: Optional[str] = "#FFFFFF"
    answerTextColor: Optional[str] = "#367EE9"
    fontFamily: Optional[str] = "Inter"

class FormBase(BaseModel):
    title: str = "Untitled Form"
    description: Optional[str] = ""
    status: Optional[str] = "draft"
    theme: Optional[ThemeSchema] = Field(default_factory=ThemeSchema)
    welcome_enabled: Optional[bool] = True
    welcome_title: Optional[str] = "Welcome!"
    welcome_description: Optional[str] = "Please take a minute to answer these questions."
    welcome_button_text: Optional[str] = "Start Form"
    thank_you_title: Optional[str] = "Thank you for taking the time!"
    thank_you_description: Optional[str] = "Your responses have been recorded."
    thank_you_button_text: Optional[str] = "Submit another response"
    thank_you_button_url: Optional[str] = ""

class FormCreate(FormBase):
    slug: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = []

class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    theme: Optional[ThemeSchema] = None
    welcome_enabled: Optional[bool] = None
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    welcome_button_text: Optional[str] = None
    thank_you_title: Optional[str] = None
    thank_you_description: Optional[str] = None
    thank_you_button_text: Optional[str] = None
    thank_you_button_url: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = None

class FormOut(FormBase):
    id: str
    slug: str
    created_at: datetime
    updated_at: datetime
    response_count: int = 0
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True

class ResponseCreate(BaseModel):
    answers: Dict[str, Any]

class ResponseOut(BaseModel):
    id: str
    form_id: str
    answers: Dict[str, Any]
    submitted_at: datetime

    class Config:
        from_attributes = True

class QuestionStat(BaseModel):
    question_id: str
    title: str
    type: str
    total_answers: int
    option_counts: Optional[Dict[str, int]] = None
    text_samples: Optional[List[str]] = None
    average_rating: Optional[float] = None

class FormStatsOut(BaseModel):
    total_responses: int
    question_stats: List[QuestionStat]
