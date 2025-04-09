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

def calcular_data_entrega(origem_raw, destino_raw, velocidade_media_km_dia=450):
    # Sua API Key aqui
    api_key = "5b3ce3597851110001cf624819c6d87fd9a8427780fd37a1864e8178"
    client = openrouteservice.Client(key=api_key)

    # Formata nomes das cidades
    origem = formatar_cidade_estado(origem_raw)
    destino = formatar_cidade_estado(destino_raw)

    # Geocodifica origem e destino
    coords_origem = client.pelias_search(text=origem)['features'][0]['geometry']['coordinates']
    coords_destino = client.pelias_search(text=destino)['features'][0]['geometry']['coordinates']

    # Calcula rota
    rota = client.directions(
        coordinates=[coords_origem, coords_destino],
        profile='driving-car',
        format='json'
    )

    distancia_km = rota['routes'][0]['summary']['distance'] / 1000

    # Estimativa de tempo
    dias_estimados = distancia_km / velocidade_media_km_dia
    tempo_estimado = timedelta(days=dias_estimados)

    # Data e hora atual + tempo estimado
    data_entrega = datetime.now() + tempo_estimado

    return data_entrega
