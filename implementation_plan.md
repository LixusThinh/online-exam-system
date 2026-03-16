# Database Schema Implementation Plan

## Proposed Changes

We will create new files for the requested SQLAlchemy models and update existing ones to establish the necessary relationships.

### Database Models

#### [MODIFY] [models/user.py](file:///d:/Code_Ca_Nhan/online-exam-system/backend/models/user.py)
- Add `classes`, `quizzes`, and `submissions` relationships using `sqlalchemy.orm.relationship`.

#### [NEW] `models/classes.py` (Using `classes` because `class` is a reserved keyword in Python)
- Create `Class` model with `id`, `name`, `invite_code`, and `teacher_id` (ForeignKey to `users.id`).

#### [NEW] `models/quiz.py`
- Create `Quiz` model with `id`, `title`, `time_limit`, `password`, `teacher_id`, and `class_id`.

#### [NEW] `models/question.py`
- Create `Question` model linking to `Quiz`.
- Create `Choice` model linking to `Question`, with `is_correct` field.

#### [NEW] `models/submission.py`
- Create `Submission` model with `student_id`, `quiz_id`, `score`, and `status`.

### Database Initialization

#### [MODIFY] [models/__init__.py](file:///d:/Code_Ca_Nhan/online-exam-system/backend/models/__init__.py)
- Import all newly created models so `Base.metadata.create_all` detects them.

#### [MODIFY] [database.py](file:///d:/Code_Ca_Nhan/online-exam-system/backend/database.py)
- Add an `init_db()` function that imports models and calls `Base.metadata.create_all(bind=engine)`.
- Automatically invoke or provide a way to trigger table creation when the server runs.

#### [MODIFY] [main.py](file:///d:/Code_Ca_Nhan/online-exam-system/backend/main.py)
- Update the app startup to use the new `init_db()` function from [database.py](file:///d:/Code_Ca_Nhan/online-exam-system/backend/database.py) to auto-create tables.

## Verification Plan

### Automated Tests
- Run `python -m pytest` or try starting the FastAPI server `uvicorn main:app --reload` to verify that there are no model initialization errors and the database file (`online_exam.db`) is populated with the correct tables.

### Manual Verification
- Use an SQLite viewer tool or CLI to check if the generated `online_exam.db` has the tables ([users](file:///d:/Code_Ca_Nhan/online-exam-system/backend/main.py#87-93), `classes`, `quizzes`, `questions`, `choices`, `submissions`) with their respective schemas.
