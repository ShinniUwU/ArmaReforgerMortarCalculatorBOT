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
from ballistics import mortars
from decimal import Decimal, ROUND_HALF_UP
import sys

def get_min_max_elev(mortar_model, shell_type, ring):
    charge_data = mortars[mortar_model][shell_type][ring]
    elevs = [v[0] for v in charge_data['Dists'].values()]
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
            return {
                'elev': y0[0] + (y1[0] - y0[0]) * ratio,
                'tof': y0[1] + (y1[1] - y0[1]) * ratio,
                'delev': y0[2] + (y1[2] - y0[2]) * ratio
            }
    y = table[keys[0]] if value < keys[0] else table[keys[-1]]
    return {'elev': y[0], 'tof': y[1], 'delev': y[2]}

def format_solution_for_discord(solutions, task):
    mortar = solutions[0]["mortar"]
    target_coords = solutions[0]["target_coords"]
    least = solutions[0]["least_tof"]
    mortar_model = mortar["model"]
    shell_type = mortar["shell_type"]
    ring = least["charge"]
    azimuth = task["fo_azimuth_deg"]
    dist = task["fo_dist"]
    elev_diff = target_coords[2] - mortar["elev"]
    # Interpolate ballistic table for this distance
    charge_data = mortars[mortar_model][shell_type][ring]['Dists']
    interp = interpolate_table(charge_data, dist)
    distance_mils = int(interp['elev'])
    elevation_mils = int((abs(elev_diff) / 100) * interp['delev'])
    total_mils = distance_mils + elevation_mils
    azimuth_decimal = Decimal(str(azimuth))
    azimuth_display = float(azimuth_decimal.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP))
    # Use correct mils system for Russian vs NATO
    if mortar_model == '2B14':
        degree_mils = int((azimuth_decimal * Decimal('16.6666666667')).to_integral_value(rounding=ROUND_HALF_UP))
    else:
        degree_mils = int((azimuth_decimal * Decimal('17.7777777778')).to_integral_value(rounding=ROUND_HALF_UP))
    print(f"DEBUG: azimuth for mils = {azimuth}, degree_mils = {degree_mils}", file=sys.stderr)
    quick_bar = (
        f"↔{int(dist)}m ⬆{abs(int(elev_diff))}m {azimuth_display:.1f}° | ⬆{total_mils}mils ↔{degree_mils}mils"
    )
    mortar_coords = mortar['coords']
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
        f"Shell: {shell_type}\n"
        f"Mortar: {mortar_model}\n"
    )
    return {"quick_bar": quick_bar, "details": details}

def process_task(task):
    mission_type = task['mission_type']
    mortar_model = task['mortar_model']
    shell_type = task['shell_type']
    ring = task['ring']
    creep_direction = task['creep_direction']
    fo_grid_str = task['fo_grid_str']
    fo_elev = task['fo_elev']
    fo_azimuth_deg = task['fo_azimuth_deg']
    fo_dist = task['fo_dist']
    fo_elev_diff = task['fo_elev_diff']
    corr_lr = task['corr_lr']
    corr_ad = task['corr_ad']
    mortars_data = task['mortars']
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
            "callsign": m_data['callsign'],
            "model": mortar_model,
            "shell_type": shell_type
        })
    if "target_coords" in task and task["target_coords"]:
        initial_target = tuple(task["target_coords"])
    else:
        initial_target_easting, initial_target_northing = calculate_target_coords(
            fo_grid_str, fo_azimuth_deg, fo_dist, fo_elev_diff, corr_lr, corr_ad
        )
        initial_target_elev = fo_elev + fo_elev_diff
        initial_target = (initial_target_easting, initial_target_northing, initial_target_elev)
    try:
        if mission_type == "Regular":
            solutions = calculate_regular_mission(mortars, initial_target, mortar_model, shell_type, ring)
        elif mission_type == "Small Barrage":
            solutions = calculate_small_barrage(mortars, initial_target, mortar_model, shell_type, ring)
        elif mission_type == "Large Barrage":
            solutions = calculate_large_barrage(mortars, initial_target, mortar_model, shell_type, ring)
        elif mission_type == "Creeping Barrage":
            solutions = calculate_creeping_barrage(mortars, initial_target, creep_direction, mortar_model, shell_type, ring)
        else:
            raise ValueError(f"Invalid mission type: {mission_type}")
    except ValueError as e:
        return {"quick_bar": f"↔{int(fo_dist)}m ↑{int(fo_elev)}m {fo_azimuth_deg:.1f}° | Out of range", "details": f"No valid firing solution: {str(e)}"}
    if not solutions or not solutions[0]['least_tof']:
        return {"quick_bar": f"↔{int(fo_dist)}m ↑{int(fo_elev)}m {fo_azimuth_deg:.1f}° | Out of range", "details": "No valid firing solution for these parameters."}
    return format_solution_for_discord(solutions, task)
