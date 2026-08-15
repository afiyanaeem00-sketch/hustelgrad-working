"""
Seed the database with sample data that mirrors the mock data used in the
React frontend (students, companies, drives, applications, internships).

Run with:
    python -m app.seed
"""
from datetime import date

from app.database import Base, engine, SessionLocal
from app import models
from app.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def get_or_create_user(email, full_name, role, institution="Placement Cell"):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return user
    user = models.User(
        full_name=full_name,
        email=email,
        password_hash=hash_password("Password@123"),
        role=role,
        institution=institution,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_company(**kwargs):
    company = db.query(models.Company).filter(models.Company.name == kwargs["name"]).first()
    if company:
        return company
    company = models.Company(**kwargs)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def get_or_create_student(roll, **kwargs):
    student = db.query(models.Student).filter(models.Student.roll == roll).first()
    if student:
        return student
    student = models.Student(roll=roll, **kwargs)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def main():
    # ── Admin / staff users ──────────────────────────────────────────────
    get_or_create_user("officer@hustlegrad.com", "Ananya Rao", models.UserRole.placement_officer)
    get_or_create_user("coordinator@hustlegrad.com", "Vivek Nair", models.UserRole.placement_coordinator)

    # ── Companies ─────────────────────────────────────────────────────────
    google = get_or_create_company(
        name="Google", logo="GO", logo_color="#1a73e8", logo_bg="#dbeafe",
        industry="Technology", location="Hyderabad / Remote",
        hr_name="Shreya Kapoor", hr_email="shreya.kapoor@google.com", hr_phone="+91 98400 11000",
        past_visits=4, students_hired=12, avg_package_lpa=38, highest_package_lpa=42, last_visit="Jan 2026",
    )
    goldman = get_or_create_company(
        name="Goldman Sachs", logo="GS", logo_color="#0d3b6e", logo_bg="#dbeafe",
        industry="Finance / Technology", location="Bengaluru",
        hr_name="Priya Menon", hr_email="priya.menon@gs.com", hr_phone="+91 94400 33000",
        past_visits=3, students_hired=9, avg_package_lpa=36, highest_package_lpa=42, last_visit="Aug 2026",
    )
    infosys = get_or_create_company(
        name="Infosys Ltd.", logo="IN", logo_color="#6750a4", logo_bg="#ede9fe",
        industry="IT Services", location="Hyderabad Campus",
        hr_name="Kunal Deshmukh", hr_email="kunal.d@infosys.com", hr_phone="+91 90112 44000",
        past_visits=6, students_hired=40, avg_package_lpa=7.5, highest_package_lpa=9, last_visit="Aug 2026",
    )

    if not google.job_history:
        db.add_all([
            models.CompanyJobHistory(company_id=google.id, year="2026", role="SWE — L3", hired=3, package="₹42 LPA"),
            models.CompanyJobHistory(company_id=google.id, year="2025", role="SWE — L3", hired=4, package="₹38 LPA"),
        ])
        db.commit()

    # ── Placement Drives ─────────────────────────────────────────────────
    if not db.query(models.PlacementDrive).filter_by(company_id=goldman.id).first():
        db.add(models.PlacementDrive(
            company_id=goldman.id, position="Analyst — Technology", package="₹38 LPA", package_lpa=38,
            type=models.DriveType.FTE, eligibility="CGPA >= 8.5, CS / Mathematics",
            skills=["Python", "Finance Basics", "SQL"],
            registration_deadline=date(2026, 8, 5), interview_date=date(2026, 8, 14),
            venue="Hyderabad Campus", status=models.DriveStatus.Open, applications_count=34,
        ))
    if not db.query(models.PlacementDrive).filter_by(company_id=infosys.id).first():
        db.add(models.PlacementDrive(
            company_id=infosys.id, position="Systems Engineer", package="₹7.5 LPA", package_lpa=7.5,
            type=models.DriveType.FTE, eligibility="CGPA >= 6.5, All departments",
            skills=["Java", "DBMS", "Networking"],
            registration_deadline=date(2026, 8, 10), interview_date=date(2026, 8, 19),
            venue="Hyderabad Campus", status=models.DriveStatus.Open, applications_count=112,
        ))
    db.commit()

    # ── Students ──────────────────────────────────────────────────────────
    priya = get_or_create_student(
        "CS21B042", name="Priya Sharma", initials="PS", avatar_color="#5b21b6", avatar_bg="#ede9fe",
        department="Computer Science", batch="2025", semester=8, cgpa=9.1,
        status=models.PlacementStatus.Placed, company="Google", resume_url="#",
        email="priya.sharma@iith.ac.in", phone="+91 98400 11234", hometown="Bengaluru, KA",
        github="github.com/priyasharma", linkedin="linkedin.com/in/priyasharma", portfolio="priyasharma.dev",
        bio="Full-stack engineer passionate about distributed systems and developer tooling.",
        skills=["Python", "React", "Go", "Kubernetes", "PostgreSQL", "GraphQL"],
        graduation_year=2025, total_backlogs=0,
    )
    arjun = get_or_create_student(
        "EC21B017", name="Arjun Mehta", initials="AM", avatar_color="#0369a1", avatar_bg="#e0f2fe",
        department="Electronics", batch="2025", semester=8, cgpa=8.7,
        status=models.PlacementStatus.Offered, company="Qualcomm", resume_url="#",
        email="arjun.mehta@iith.ac.in", phone="+91 90000 22345", hometown="Jaipur, RJ",
        github="github.com/arjunmehta", linkedin="linkedin.com/in/arjunmehta", portfolio="",
        bio="VLSI design enthusiast with focus on low-power embedded systems.",
        skills=["VLSI Design", "Verilog", "MATLAB", "Embedded C"],
        graduation_year=2025, total_backlogs=0,
    )

    if not priya.certifications:
        db.add_all([
            models.Certification(student_id=priya.id, name="Google Cloud Professional", issuer="Google", year=2024),
            models.Certification(student_id=priya.id, name="AWS Solutions Architect", issuer="Amazon", year=2023),
        ])
    if not priya.semester_records:
        for sem, gpa in [(1, 8.9), (2, 9.0), (3, 9.2), (4, 9.1), (5, 9.3), (6, 9.0), (7, 9.2)]:
            db.add(models.SemesterRecord(student_id=priya.id, sem=sem, gpa=gpa, backlogs=0))
    db.commit()

    if not priya.applications:
        db.add(models.Application(
            student_id=priya.id, company="Google", role="SWE — L3",
            applied_date=date(2026, 2, 1), stage=models.ApplicationStage.Joined,
            package="₹42 LPA", offer_date=date(2026, 3, 1), joining_date=date(2026, 7, 1),
        ))
    if not arjun.applications:
        db.add(models.Application(
            student_id=arjun.id, company="Qualcomm", role="VLSI Engineer",
            applied_date=date(2026, 3, 1), stage=models.ApplicationStage.Offered,
            package="₹28 LPA", offer_date=date(2026, 3, 20),
        ))
    db.commit()

    if not priya.internships:
        db.add(models.Internship(
            student_id=priya.id, company="Google", role="SWE Intern", duration="3 months",
            start_date=date(2025, 5, 1), end_date=date(2025, 7, 31), mentor="Rajan Krishnamurthy",
            stipend="₹1.2L/mo", ppo_eligible=True, ppo_converted=True, status=models.InternshipStatus.Completed,
        ))
    db.commit()

    # ── Sample communication ────────────────────────────────────────────
    if not db.query(models.SentMessage).first():
        db.add(models.SentMessage(
            channel=models.CommChannel.Email, audience="All CS 2025 Batch",
            subject="Goldman Sachs Drive — Registration Open",
            recipients=63, status=models.CommStatus.Delivered,
        ))
    db.commit()

    print("Seed data inserted successfully.")


if __name__ == "__main__":
    main()
    db.close()
