from fastapi import APIRouter
from utils.status import obter_status

router = APIRouter()

@router.get("/status-nfe")
def status_nfe():
    return obter_status()
