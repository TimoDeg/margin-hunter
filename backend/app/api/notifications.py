from fastapi import APIRouter, HTTPException, status
import httpx

from ..config import get_settings


router = APIRouter()


@router.get("/status")
async def get_notification_status() -> dict:
  """
  Einfache Status-Info für den Telegram-Bot aus Sicht des Backends.
  """
  settings = get_settings()

  configured = bool(settings.telegram_bot_token and settings.telegram_chat_ids_list)

  bot_reachable = False
  try:
      async with httpx.AsyncClient(timeout=2.0) as client:
          resp = await client.get("http://telegram-bot:8001/health")
          bot_reachable = resp.status_code == 200
  except Exception:
      bot_reachable = False

  return {
      "configured": configured,
      "bot_reachable": bot_reachable,
  }


@router.post("/test", status_code=status.HTTP_202_ACCEPTED)
async def send_test_notification() -> dict:
  """
  Sende eine einfache Testnachricht über den Telegram-Bot.
  """
  settings = get_settings()
  if not settings.telegram_bot_token or not settings.telegram_chat_ids_list:
      raise HTTPException(
          status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
          detail="Telegram-Bot ist nicht konfiguriert (Token oder Chat-IDs fehlen).",
      )

  message = "📈 Margin Hunter – Testnachricht vom Backend"

  try:
      async with httpx.AsyncClient(timeout=5.0) as client:
          resp = await client.post(
              "http://telegram-bot:8001/notify",
              json={"message": message},
          )
          resp.raise_for_status()
  except httpx.HTTPError as exc:  # pragma: no cover
      raise HTTPException(
          status_code=status.HTTP_502_BAD_GATEWAY,
          detail=f"Telegram-Bot nicht erreichbar: {exc}",
      ) from exc

  return {"detail": "Test notification enqueued"}



