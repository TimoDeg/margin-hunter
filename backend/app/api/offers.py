from collections.abc import Sequence
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Offer, PriceHistory
from ..schemas import OfferCreate, OfferOut, OfferUpdateStatus, PriceHistoryOut


router = APIRouter()


@router.get("", response_model=list[OfferOut])
async def list_offers(
    status_filter: str | None = Query(None, alias="status"),
    product_id: int | None = None,
    min_margin: float | None = None,
    session: AsyncSession = Depends(get_session),
) -> Sequence[Offer]:
    stmt: Select[tuple[Offer]] = select(Offer)

    conditions = []
    if status_filter:
        conditions.append(Offer.status == status_filter)
    if product_id:
        conditions.append(Offer.product_id == product_id)
    if min_margin is not None:
        conditions.append(Offer.margin_percent >= min_margin)

    if conditions:
        stmt = stmt.where(and_(*conditions))

    stmt = stmt.order_by(Offer.first_seen_at.desc())

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/{offer_id}", response_model=OfferOut)
async def get_offer(
    offer_id: int,
    session: AsyncSession = Depends(get_session),
) -> Offer:
    offer = await session.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return offer


@router.put("/{offer_id}/status", response_model=OfferOut)
async def update_offer_status(
    offer_id: int,
    payload: OfferUpdateStatus,
    session: AsyncSession = Depends(get_session),
) -> Offer:
    offer = await session.get(Offer, offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    offer.status = payload.status
    offer.last_checked_at = datetime.utcnow()

    await session.commit()
    await session.refresh(offer)
    return offer


@router.get("/{offer_id}/history", response_model=list[PriceHistoryOut])
async def get_offer_history(
    offer_id: int,
    session: AsyncSession = Depends(get_session),
) -> Sequence[PriceHistory]:
    stmt = (
        select(PriceHistory)
        .where(PriceHistory.offer_id == offer_id)
        .order_by(PriceHistory.recorded_at.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreate,
    session: AsyncSession = Depends(get_session),
) -> Offer:
    offer = Offer(**payload.model_dump())
    session.add(offer)
    await session.commit()
    await session.refresh(offer)
    return offer


