from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str
    category: str
    brands: list[str] = Field(default_factory=list)
    filters: dict[str, Any] = Field(default_factory=dict)
    price_min: float
    price_max: float
    active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    brands: list[str] | None = None
    filters: dict[str, Any] | None = None
    price_min: float | None = None
    price_max: float | None = None
    active: bool | None = None


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OfferBase(BaseModel):
    product_id: int
    title: str
    price: float
    url: str
    image_url: str | None = None
    seller_name: str | None = None
    location: str | None = None
    description: str | None = None
    status: str = "new"
    margin_percent: float | None = None
    geizhals_price: float | None = None


class OfferCreate(OfferBase):
    pass


class OfferUpdateStatus(BaseModel):
    status: str


class OfferOut(OfferBase):
    id: int
    first_seen_at: datetime
    last_checked_at: datetime

    class Config:
        from_attributes = True


class PriceHistoryOut(BaseModel):
    id: int
    offer_id: int
    price: float
    recorded_at: datetime

    class Config:
        from_attributes = True


class ContactOut(BaseModel):
    id: int
    offer_id: int
    message_template: str
    sent_at: datetime
    response_received: bool
    notes: str | None = None

    class Config:
        from_attributes = True


class PriceReferenceOut(BaseModel):
    id: int
    product_id: int
    source: str
    price: float
    url: str | None = None
    updated_at: datetime

    class Config:
        from_attributes = True


