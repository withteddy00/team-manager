"""
Moroccan public holidays - fixed dates and Islamic holidays (approximate).
Islamic holidays shift each year based on the Hijri calendar.
We provide approximate Gregorian dates for common years.
"""

from datetime import date
from typing import List, Dict


def get_fixed_moroccan_holidays(year: int) -> List[Dict[str, str]]:
    """Fixed Gregorian date holidays in Morocco."""
    return [
        {"date": f"{year}-01-01", "name": "Jour de l'An"},
        {"date": f"{year}-01-11", "name": "Manifeste de l'Indépendance"},
        {"date": f"{year}-05-01", "name": "Fête du Travail"},
        {"date": f"{year}-07-30", "name": "Fête du Trône"},
        {"date": f"{year}-08-14", "name": "Journée de Oued Ed-Dahab"},
        {"date": f"{year}-08-20", "name": "Révolution du Roi et du Peuple"},
        {"date": f"{year}-08-21", "name": "Fête de la Jeunesse"},
        {"date": f"{year}-11-06", "name": "Marche Verte"},
        {"date": f"{year}-11-18", "name": "Fête de l'Indépendance"},
    ]


def get_islamic_holidays_approximate(year: int) -> List[Dict[str, str]]:
    """
    Approximate Islamic holidays for Morocco.
    These dates shift ~11 days earlier each Gregorian year.
    We provide approximate dates for 2024-2030.
    """
    islamic_holidays_by_year = {
        2024: [
            {"date": "2024-01-13", "name": "Nouvel An Hégirien (1446)"},
            {"date": "2024-03-27", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2024-03-28", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2024-04-10", "name": "Aïd Al Fitr"},
            {"date": "2024-04-11", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2024-06-17", "name": "Aïd Al Adha"},
            {"date": "2024-06-18", "name": "Aïd Al Adha - 2ème jour"},
        ],
        2025: [
            {"date": "2025-01-02", "name": "Nouvel An Hégirien (1447)"},
            {"date": "2025-03-16", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2025-03-17", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2025-03-30", "name": "Aïd Al Fitr"},
            {"date": "2025-03-31", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2025-06-06", "name": "Aïd Al Adha"},
            {"date": "2025-06-07", "name": "Aïd Al Adha - 2ème jour"},
        ],
        2026: [
            {"date": "2026-01-22", "name": "Nouvel An Hégirien (1448)"},
            {"date": "2026-03-06", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2026-03-07", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2026-03-20", "name": "Aïd Al Fitr"},
            {"date": "2026-03-21", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2026-05-27", "name": "Aïd Al Adha"},
            {"date": "2026-05-28", "name": "Aïd Al Adha - 2ème jour"},
        ],
        2027: [
            {"date": "2027-01-11", "name": "Nouvel An Hégirien (1449)"},
            {"date": "2027-02-23", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2027-02-24", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2027-03-10", "name": "Aïd Al Fitr"},
            {"date": "2027-03-11", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2027-05-16", "name": "Aïd Al Adha"},
            {"date": "2027-05-17", "name": "Aïd Al Adha - 2ème jour"},
        ],
        2028: [
            {"date": "2028-01-01", "name": "Nouvel An Hégirien (1450)"},
            {"date": "2028-02-12", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2028-02-13", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2028-02-28", "name": "Aïd Al Fitr"},
            {"date": "2028-02-29", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2028-05-05", "name": "Aïd Al Adha"},
            {"date": "2028-05-06", "name": "Aïd Al Adha - 2ème jour"},
            {"date": "2028-12-20", "name": "Nouvel An Hégirien (1451)"},
        ],
        2029: [
            {"date": "2029-02-01", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2029-02-02", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2029-02-17", "name": "Aïd Al Fitr"},
            {"date": "2029-02-18", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2029-04-24", "name": "Aïd Al Adha"},
            {"date": "2029-04-25", "name": "Aïd Al Adha - 2ème jour"},
            {"date": "2029-12-10", "name": "Nouvel An Hégirien (1452)"},
        ],
        2030: [
            {"date": "2030-01-21", "name": "Anniversaire du Prophète (Mawlid)"},
            {"date": "2030-01-22", "name": "Anniversaire du Prophète (Mawlid) - 2ème jour"},
            {"date": "2030-02-06", "name": "Aïd Al Fitr"},
            {"date": "2030-02-07", "name": "Aïd Al Fitr - 2ème jour"},
            {"date": "2030-04-13", "name": "Aïd Al Adha"},
            {"date": "2030-04-14", "name": "Aïd Al Adha - 2ème jour"},
            {"date": "2030-11-29", "name": "Nouvel An Hégirien (1453)"},
        ],
    }
    return islamic_holidays_by_year.get(year, [])


def get_all_moroccan_holidays(year: int) -> List[Dict[str, str]]:
    """Get all Moroccan holidays for a given year."""
    fixed = get_fixed_moroccan_holidays(year)
    islamic = get_islamic_holidays_approximate(year)
    all_holidays = fixed + islamic
    all_holidays.sort(key=lambda x: x["date"])
    return all_holidays


def is_moroccan_holiday(check_date: date) -> dict | None:
    """Check if a given date is a Moroccan holiday. Returns holiday info or None."""
    holidays = get_all_moroccan_holidays(check_date.year)
    for h in holidays:
        if h["date"] == check_date.isoformat():
            return h
    return None
