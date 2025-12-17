from fastapi import Depends, HTTPException
from models import User
from utils.get_current_user import get_current_user

def tem_permissao(usuario: User, codigo: str) -> bool:
    if not usuario or not usuario.grupo:
        return False

    for p in usuario.grupo.permissoes:
        if p.codigo == codigo:
            return True

    return False


def require_permissao(
    codigo: str,
    mensagem: str = "Você não tem permissão para executar esta ação"
):
    def checker(usuario: User = Depends(get_current_user)):
        if not tem_permissao(usuario, codigo):
            raise HTTPException(
                status_code=403,
                detail=mensagem
            )
        return usuario
    return checker
