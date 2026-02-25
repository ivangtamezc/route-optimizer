from fastapi import HTTPException
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

def solve_tsp(durations_s, return_to_origin: bool, time_limit_s: int):
    n = len(durations_s)
    BIG = 10**9
    cost = [[BIG]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            v = durations_s[i][j]
            cost[i][j] = BIG if v is None else int(round(v))

    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def cb(fi, ti):
        i = manager.IndexToNode(fi)
        j = manager.IndexToNode(ti)
        return cost[i][j]

    cb_idx = routing.RegisterTransitCallback(cb)
    routing.SetArcCostEvaluatorOfAllVehicles(cb_idx)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.seconds = max(1, int(time_limit_s))

    sol = routing.SolveWithParameters(params)
    if sol is None:
        raise HTTPException(status_code=500, detail="OR-Tools no solution")

    order = []
    idx = routing.Start(0)
    while not routing.IsEnd(idx):
        order.append(manager.IndexToNode(idx))
        idx = sol.Value(routing.NextVar(idx))
    order.append(manager.IndexToNode(idx))  # end

    if return_to_origin:
        return order

    # open tour: drop final depot if present
    if order and order[-1] == 0:
        order = order[:-1]
    return order
