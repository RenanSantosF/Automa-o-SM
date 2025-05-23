import openrouteservice
from datetime import datetime, timedelta

def formatar_cidade_estado(cidade_estado):
    partes = cidade_estado.split(" - ")
    if len(partes) == 2:
        cidade = partes[0].strip().title()
        estado = partes[1].strip().upper()
        return f"{cidade}, {estado}, Brasil"
    else:
        raise ValueError("Formato inválido. Use: 'CIDADE - ESTADO'")

from datetime import datetime, timedelta
import openrouteservice
from openrouteservice.exceptions import ApiError

from datetime import datetime, timedelta
import openrouteservice
from openrouteservice.exceptions import ApiError

def calcular_data_entrega(origem_raw, destino_raw, velocidade_media_km_dia=450):
    api_key = "5b3ce3597851110001cf624819c6d87fd9a8427780fd37a1864e8178"
    client = openrouteservice.Client(key=api_key)

    origem = formatar_cidade_estado(origem_raw)
    destino = formatar_cidade_estado(destino_raw)

    try:
        coords_origem = client.pelias_search(text=origem)['features'][0]['geometry']['coordinates']
        coords_destino = client.pelias_search(text=destino)['features'][0]['geometry']['coordinates']

        rota = client.directions(
            coordinates=[coords_origem, coords_destino],
            profile='driving-car',
            format='json'
        )

        distancia_km = rota['routes'][0]['summary']['distance'] / 1000
        dias_estimados = distancia_km / velocidade_media_km_dia
        tempo_estimado = timedelta(days=dias_estimados)

        data_entrega = datetime.now() + tempo_estimado
        print(f"[INFO] Data estimada de entrega calculada com sucesso: {data_entrega}")

    except (ApiError, IndexError, KeyError) as e:
        print(f"[ERRO] Falha ao calcular rota: {e}")
        data_entrega = datetime.now() + timedelta(days=2)
        print(f"[INFO] Usando fallback de 2 dias: {data_entrega}")

    # Formata para "DD/MM/YYYY HH:MM"
    return data_entrega.strftime("%d/%m/%Y %H:%M")
