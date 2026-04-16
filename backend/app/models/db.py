from __future__ import annotations

from datetime import datetime
import os
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./complyt.db")

engine = create_engine(
	DATABASE_URL,
	pool_pre_ping=True,
	connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
	pass


class User(Base):
	__tablename__ = "users"

	id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	full_name: Mapped[str] = mapped_column(String(255), nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

	documents: Mapped[list[Document]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Document(Base):
	__tablename__ = "documents"

	id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
	filename: Mapped[str] = mapped_column(String(255), nullable=False)
	content_type: Mapped[str] = mapped_column(String(100), nullable=False)
	file_size: Mapped[int] = mapped_column(Integer, nullable=False)
	storage_path: Mapped[str] = mapped_column(Text, nullable=False)

	idempotency_key: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
	status: Mapped[str] = mapped_column(String(30), default="queued", nullable=False, index=True)
	task_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
	error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

	result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
	encrypted_pii_json: Mapped[str | None] = mapped_column(Text, nullable=True)

	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False,
	)
	processing_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

	owner: Mapped[User] = relationship(back_populates="documents")


def create_db_and_tables() -> None:
	Base.metadata.create_all(bind=engine)
	db = SessionLocal()
	from app.routes.auth import _hash_password
	if not db.query(User).filter(User.email == "executive@complyt.ai").first():
		admin = User(
			email="executive@complyt.ai",
			full_name="Executive Admin",
			password_hash=_hash_password("admin123")
		)
		db.add(admin)
		db.commit()
	db.close()


def get_db_session():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

