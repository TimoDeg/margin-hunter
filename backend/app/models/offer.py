from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Alias für url (für Scraper)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    seller_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Scraper-spezifische Felder
    source: Mapped[str | None] = mapped_column(String(50), nullable=True, default="ebay")  # ebay, kleinanzeigen, etc.
    shipping: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    condition: Mapped[str | None] = mapped_column(String(50), nullable=True)  # New, Used, Refurbished
    seller_rating: Mapped[str | None] = mapped_column(String(100), nullable=True)

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="new")

    margin_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    geizhals_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    last_checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    product = relationship("Product", backref="offers")


