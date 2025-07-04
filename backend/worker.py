import queue
import traceback
from calculations import (
    parse_grid,
    calculate_target_coords,
    calculate_regular_mission,
    calculate_small_barrage,
    calculate_large_barrage,
    calculate_creeping_barrage,
)
from ballistics import BALLISTIC_DATA

def get_min_max_elev(ammo, charge):
    charge_data = BALLISTIC_DATA[ammo][charge]
    elevs = [v['elev'] for v in charge_data['ranges'].values()]
    return min(elevs), max(elevs)

def worker_thread(task_queue, result_queue):
    while True:
        try:
            task = task_queue.get(block=True)
            if task is None:
                break
            result = process_task(task)
            result_queue.put(result)
        except Exception as e:
            result_queue.put(e)
        finally:
            task_queue.task_done()

def interpolate_table(table, value):
    keys = sorted(table.keys())
    for i in range(len(keys) - 1):
        if keys[i] <= value <= keys[i+1]:
            x0, x1 = keys[i], keys[i+1]
            y0, y1 = table[x0], table[x1]
            ratio = (value - x0) / (x1 - x0)
            return {k: y0[k] + (y1[k] - y0[k]) * ratio for k in y0}
    return table[keys[0]] if value < keys[0] else table[keys[-1]]

def format_solution_for_discord(solutions, task):
    mortar = solutions[0]["mortar"]
    target_coords = solutions[0]["target_coords"]
    least = solutions[0]["least_tof"]
    ammo = task["ammo"]
    azimuth = task["fo_azimuth_deg"]
    dist = task["fo_dist"]
    elev_diff = target_coords[2] - mortar["elev"]
    ring = least["charge"]

    # Interpolate ballistic table for this distance
    charge_data = BALLISTIC_DATA[ammo][ring]['ranges']
    interp = interpolate_table(charge_data, dist)
    distance_mils = round(interp['elev'])
    elevation_mils = round((abs(elev_diff) / 100) * interp['delev'])
    total_mils = distance_mils + elevation_mils
    degree_mils = round(azimuth * 17.777778)

    quick_bar = (
        f"↔{int(dist)}m Elevation:{abs(int(elev_diff))}m ({elevation_mils} mils) {azimuth:.1f}° | "
        f"{distance_mils}mils + {elevation_mils}mils = {total_mils}mils (azimuth: {degree_mils} mils)"
    )

    mortar_coords = task['mortars'][0]['coords']
    mortar_coords_str = f"x:{mortar_coords[0]} y:{mortar_coords[1]} z:{mortar_coords[2]}"
    target_coords_str = f"x:{target_coords[0]} y:{target_coords[1]} z:{target_coords[2]}"
    details = (
        f"Mortar Coords: {mortar_coords_str}\n"
        f"Target Coords: {target_coords_str}\n"
        f"Distance: {int(dist)} m\n"
        f"Elevation: {abs(int(elev_diff))} m\n"
        f"Elevation mils: {elevation_mils} mils\n"
        f"Azimuth: {azimuth:.1f}° ({degree_mils} mils)\n"
        f"Distance mils: {distance_mils} mils\n"
        f"Total: {total_mils} mils\n"
        f"Ring: {ring}\n"
        f"Time of Flight: {least['tof']:.1f} s\n"
        f"Dispersion: {least['dispersion']} m\n"
        f"Ammo: {ammo}\n"
    )
    return {"quick_bar": quick_bar, "details": details}

def process_task(task):
    mission_type = task['mission_type']
    ammo = task['ammo']
    creep_direction = task['creep_direction']

    fo_grid_str = task['fo_grid_str']
    fo_elev = task['fo_elev']
    fo_azimuth_deg = task['fo_azimuth_deg']
    fo_dist = task['fo_dist']
    fo_elev_diff = task['fo_elev_diff']
    corr_lr = task['corr_lr']
    corr_ad = task['corr_ad']

    mortars_data = task['mortars']

    # Accept direct coordinates if provided, else parse grid
    mortars = []
    for m_data in mortars_data:
        if "coords" in m_data and m_data["coords"]:
            coords = m_data["coords"]
        elif "grid" in m_data and m_data["grid"]:
            coords = parse_grid(m_data["grid"])
        else:
            raise ValueError("Must provide either coords or a 10-digit grid")
        mortars.append({
            "coords": coords,
            "elev": m_data['elev'],
            "callsign": m_data['callsign']
        })

    # If target_coords is provided, use it directly; else, calculate from grid/azimuth/distance
    if "target_coords" in task and task["target_coords"]:
        initial_target = tuple(task["target_coords"])
    else:
        initial_target_easting, initial_target_northing = calculate_target_coords(
            fo_grid_str, fo_azimuth_deg, fo_dist, fo_elev_diff, corr_lr, corr_ad
        )
        initial_target_elev = fo_elev + fo_elev_diff
        initial_target = (initial_target_easting, initial_target_northing, initial_target_elev)

    # Dispatch to the correct calculation function based on mission type
    try:
        if mission_type == "Regular":
            solutions = calculate_regular_mission(mortars, initial_target, ammo)
        elif mission_type == "Small Barrage":
            solutions = calculate_small_barrage(mortars, initial_target, ammo)
        elif mission_type == "Large Barrage":
            solutions = calculate_large_barrage(mortars, initial_target, ammo)
        elif mission_type == "Creeping Barrage":
            solutions = calculate_creeping_barrage(mortars, initial_target, creep_direction, ammo)
        else:
            raise ValueError(f"Invalid mission type: {mission_type}")
    except ValueError as e:
        return {"quick_bar": f"↔{int(fo_dist)}m ↑{int(fo_elev)}m {fo_azimuth_deg:.1f}° | Out of range", "details": f"No valid firing solution: {str(e)}"}

    # Out of range handling
    if not solutions or not solutions[0]['least_tof']:
        return {"quick_bar": f"↔{int(fo_dist)}m ↑{int(fo_elev)}m {fo_azimuth_deg:.1f}° | Out of range", "details": "No valid firing solution for these parameters."}

    return format_solution_for_discord(solutions, task)
