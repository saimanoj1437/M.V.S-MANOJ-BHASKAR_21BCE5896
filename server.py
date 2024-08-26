import asyncio
import websockets
import json


def initialize_new_game():

    return {
        'board':[[None for _ in range(5)] for _ in range(5)],

        'current_turn':'A',
        'players': {
            'A': {'A-P1':(4, 0), 'A-P2':(4, 1), 'A-H1':(4, 2), 'A-H2':(4, 3), 'A-P3':(4, 4)},
            'B': {'B-P1':(0, 0), 'B-P2':(0, 1), 'B-H1':(0, 2), 'B-H2':(0, 3), 'B-P3':(0, 4)}
        },

        'history': []
    }

games = {}

clients = {}


def get_next_turn(current_turn):
    return 'B' if current_turn == 'A' else 'A'


async def send_game_update(game_id):

    game = games[game_id]

    board = [[None for _ in range(5)] for _ in range(5)]


    for player, pieces in game['players'].items():

        for piece, (row, col) in pieces.items():

            board[row][col] = {'type': piece, 'player': player}

    update = {
        'type': 'update',
        'board': board,

        'next_turn':game['current_turn'],
        'history': game['history']
    }

    await broadcast(game_id, update)



async def broadcast(game_id, message):

    if game_id in clients:

        for client in clients[game_id]:


            await client.send(json.dumps(message))


async def process_move(game_id, player, move):

    game = games[game_id]
    
    if player != game['current_turn']:
        return {'type': 'error', 'message': 'Not your turn'}
    

    try:
        piece, direction = move.split(':')

        if piece not in game['players'][player]:

            return {'type': 'error', 'message': 'Invalid piece'}

        row, col = game['players'][player][piece]

    except (ValueError, KeyError):

        return {'type': 'error', 'message': 'Invalid move'}

    piece_moves = {
        'A-P1': {'L': (0, -1), 'R': (0, 1), 'F': (-1, 0), 'B': (1, 0)},
        'A-P2': {'L': (0, -1), 'R': (0, 1), 'F': (-1, 0), 'B': (1, 0)},
        'A-P3': {'L': (0, -1), 'R': (0, 1), 'F': (-1, 0), 'B': (1, 0)},
        'A-H1': {'L': (0, -2), 'R': (0, 2), 'F': (-2, 0), 'B': (2, 0)},
        'A-H2': {'L': (0, -2), 'R': (0, 2), 'F': (-2, 0), 'B': (2, 0),
                 'FL': (-2, -1), 'FR': (-2, 1), 'BL': (2, -1), 'BR': (2, 1)},
        'B-P1': {'L': (0, -1), 'R': (0, 1), 'F': (1, 0), 'B': (-1, 0)},
        'B-P2': {'L': (0, -1), 'R': (0, 1), 'F': (1, 0), 'B': (-1, 0)},
        'B-P3': {'L': (0, -1), 'R': (0, 1), 'F': (1, 0), 'B': (-1, 0)},
        'B-H1': {'L': (0, -2), 'R': (0, 2), 'F': (2, 0), 'B': (-2, 0)},
        'B-H2': {'L': (0, -2), 'R': (0, 2), 'F': (-2, 0), 'B': (2, 0),
                 'FL': (2, 1), 'FR': (2, -1), 'BL': (-2, -1), 'BR': (-2, 1)},
    }

    move_delta = piece_moves.get(piece, {}).get(direction)


    if move_delta is None:

        return {'type': 'error', 'message': 'Invalid move direction'}


    new_row, new_col = row + move_delta[0], col + move_delta[1]

    if not (0 <= new_row < 5 and 0 <= new_col < 5):

        return {'type': 'error', 'message': 'Move out of bounds'}

    if any((new_row, new_col) == pos for pos in game['players'][player].values()):

        return {'type': 'error', 'message': 'Invalid move: Cell already occupied by your own piece'}

    opponent = 'B'if player == 'A' else 'A'

    if (new_row, new_col) in game['players'][opponent].values():

        for opp_piece, pos in game['players'][opponent].items():


            if pos == (new_row, new_col):

                del game['players'][opponent][opp_piece]

                break

    game['players'][player][piece] = (new_row, new_col)


    game['history'].append({
        'player':player,

        'piece':piece,
        
        'move':direction,

        'from':(row, col),
        'to': (new_row, new_col)
    })

    if not game['players'][opponent]:  

        return {'type': 'game_over', 'winner': player}

    game['current_turn'] = get_next_turn(player)

    return None


async def handler(websocket, path):
    game_id = 'default_game'

    if game_id not in games:

        games[game_id] = initialize_new_game()

        clients[game_id] = []

    clients[game_id].append(websocket)

    await send_game_update(game_id)

    try:
        async for message in websocket:


            data = json.loads(message)

            if data['type'] == 'move':

                error = await process_move(game_id, data['player'], data['move'])

                if error:
                    await websocket.send(json.dumps(error))

                else:
                    await send_game_update(game_id)

           
            elif data['type'] == 'new_game':

                games[game_id] = initialize_new_game()

                await send_game_update(game_id)


                await websocket.send(json.dumps({'type': 'new_game'}))


            elif data['type'] == 'reset':

                games[game_id] = initialize_new_game()  

                await send_game_update(game_id)  

                await websocket.send(json.dumps({
                    'type':'update',

                    'board':games[game_id]['board'],

                    'next_turn':games[game_id]['current_turn'],

                    'history':games[game_id]['history']
                }))


    finally:

        clients[game_id].remove(websocket)

        if not clients[game_id]:

            del games[game_id]
            del clients[game_id]



start_server = websockets.serve(handler, "localhost", 8000)

asyncio.get_event_loop().run_until_complete(start_server)

asyncio.get_event_loop().run_forever()
