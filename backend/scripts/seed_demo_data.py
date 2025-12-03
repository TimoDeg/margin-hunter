from __future__ import annotations

"""
Einfache Seed-Scripts für Demo-Daten in der Entwicklungsumgebung.

Nutzt die synchrone SQLAlchemy-Session aus `app.database` und kann z.B. so
ausgeführt werden (innerhalb des backend-Containers oder lokal mit passender .env):

    python -m app.scripts.seed_demo_data
"""

from datetime import datetime

from app.database import SyncSessionLocal
from app.models.offer import Offer
from app.models.product import Product


def seed_products(session) -> list[Product]:
    products: list[Product] = []

    if session.query(Product).count() > 0:
        return session.query(Product).all()

    gpu = Product(
        name="NVIDIA RTX 3080",
        category="gpu",
        brands=["NVIDIA", "RTX"],
        filters={"min_vram_gb": 10},
        price_min=400.0,
        price_max=800.0,
        active=True,
    )

    console = Product(
        name="PlayStation 5",
        category="console",
        brands=["Sony", "PlayStation"],
        filters={"edition": "Standard"},
        price_min=350.0,
        price_max=650.0,
        active=True,
    )

    session.add_all([gpu, console])
    session.commit()
    session.refresh(gpu)
    session.refresh(console)

    products.extend([gpu, console])
    return products


def seed_offers(session, products: list[Product]) -> None:
    if session.query(Offer).count() > 0:
        return

    now = datetime.utcnow()

    demo_offers = [
        Offer(
            product_id=products[0].id,
            title="RTX 3080 gebraucht, guter Zustand",
            price=550.0,
            url="https://example.com/offer/rtx-3080-demo-1",
            image_url=None,
            seller_name="Max Mustermann",
            location="Berlin",
            description="Wenig genutzt, Nichtraucher-Haushalt.",
            status="new",
            margin_percent=25.0,
            geizhals_price=700.0,
            first_seen_at=now,
            last_checked_at=now,
        ),
        Offer(
            product_id=products[1].id,
            title="PlayStation 5 mit 2 Controllern",
            price=450.0,
            url="https://example.com/offer/ps5-demo-1",
            image_url=None,
            seller_name="Erika Musterfrau",
            location="Hamburg",
            description="Originalverpackung vorhanden.",
            status="open",
            margin_percent=18.0,
            geizhals_price=550.0,
            first_seen_at=now,
            last_checked_at=now,
        ),
    ]

    session.add_all(demo_offers)
    session.commit()


def main() -> None:
    if SyncSessionLocal is None:
        raise RuntimeError(
            "SyncSessionLocal ist nicht konfiguriert. "
            "Stelle sicher, dass DATABASE_URL_SYNC in deiner .env gesetzt ist."
        )

    session = SyncSessionLocal()
    try:
        products = seed_products(session)
        seed_offers(session, products)
        print("Demo-Daten erfolgreich angelegt.")
    finally:
        session.close()


if __name__ == "__main__":
    main()


