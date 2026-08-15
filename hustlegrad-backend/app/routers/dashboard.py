from datetime import date
from collections import OrderedDict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.routers.drives import _to_with_company

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_students = db.query(func.count(models.Student.id)).scalar() or 0
    placed_students = (
        db.query(func.count(models.Student.id))
        .filter(models.Student.status == models.PlacementStatus.Placed)
        .scalar() or 0
    )
    placement_rate = (placed_students / total_students * 100) if total_students else 0

    avg_package = (
        db.query(func.avg(models.Company.avg_package_lpa)).scalar() or 0
    )

    companies_visited = db.query(func.count(models.Company.id)).scalar() or 0

    kpis = [
        schemas.KpiOut(
            label="Placement Rate",
            value=f"{placement_rate:.1f}%",
            delta="+0.0%",
            up=True,
            sub="vs last academic year",
        ),
        schemas.KpiOut(
            label="Avg. Package",
            value=f"₹{avg_package:.1f} LPA",
            delta="+₹0.0 LPA",
            up=True,
            sub="median CTC offered",
        ),
        schemas.KpiOut(
            label="Students Placed",
            value=str(placed_students),
            delta="+0",
            up=True,
            sub=f"out of {total_students} eligible",
        ),
        schemas.KpiOut(
            label="Companies Visited",
            value=str(companies_visited),
            delta="+0",
            up=True,
            sub="this academic year",
        ),
    ]

    # Students placed per month, based on joining_date of Joined applications.
    # Grouped in Python (rather than a DB-specific date-format function) so
    # month labels are consistent regardless of MySQL locale settings.
    joining_dates = (
        db.query(models.Application.joining_date)
        .filter(models.Application.stage == models.ApplicationStage.Joined)
        .filter(models.Application.joining_date.isnot(None))
        .all()
    )
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    chart_map = OrderedDict((m, 0) for m in month_names)
    for (joining_date,) in joining_dates:
        chart_map[month_names[joining_date.month - 1]] += 1
    chart = [schemas.ChartPointOut(month=m, placed=c) for m, c in chart_map.items()]

    upcoming = (
        db.query(models.PlacementDrive)
        .options(joinedload(models.PlacementDrive.company))
        .filter(models.PlacementDrive.status.in_([models.DriveStatus.Open, models.DriveStatus.Upcoming]))
        .order_by(models.PlacementDrive.interview_date)
        .limit(10)
        .all()
    )

    notifications = (
        db.query(models.Notification)
        .filter(
            (models.Notification.user_id == current_user.id) | (models.Notification.user_id.is_(None))
        )
        .order_by(models.Notification.created_at.desc())
        .limit(10)
        .all()
    )

    return schemas.DashboardOut(
        kpis=kpis,
        chart=chart,
        upcoming_drives=[_to_with_company(d) for d in upcoming],
        notifications=notifications,
    )
