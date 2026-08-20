import sys
from pathlib import Path
import unittest

_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from backend.routes.certificates import router as certificates_router
from backend.schemas.analytics import AnalyticsSummary
from backend.schemas.certificate import CertificateOut


class FrontendCompatibilityTests(unittest.TestCase):
    def test_dashboard_analytics_summary_retains_frontend_fields(self):
        summary = AnalyticsSummary(
            total_attempts=4,
            average_score=82.5,
            topics_attempted=2,
            strongest_topic="Python",
            weakest_topic="SQL",
            pass_rate=75.0,
            certificates_earned=2,
            topics_mastered=1,
            weak_areas=[{"topic_name": "SQL", "gap": 35}],
        )

        payload = summary.model_dump()
        self.assertEqual(payload["certificates_earned"], 2)
        self.assertEqual(payload["topics_mastered"], 1)
        self.assertEqual(payload["weak_areas"][0]["topic_name"], "SQL")

    def test_certificate_out_exposes_compatibility_code_field(self):
        certificate = CertificateOut(
            id=1,
            certificate_id="OA-2026-ABC123",
            user_id=2,
            topic_id=3,
            topic_name="Python",
            student_name="Jane",
            certificate_type="participation",
            score=90,
            total=100,
            percentage=90.0,
            issued_at="2026-01-01T00:00:00",
            cert_code="OA-2026-ABC123",
        )

        payload = certificate.model_dump()
        self.assertEqual(payload["cert_code"], "OA-2026-ABC123")

    def test_certificate_router_accepts_trailing_slash_list_route(self):
        registered_paths = {getattr(route, "path", None) for route in certificates_router.routes}
        self.assertIn("/certificates/", registered_paths)

    def test_portfolio_service_uses_certificate_list_route(self):
        service_path = Path(__file__).resolve().parents[2] / "frontend" / "services" / "portfolio.service.ts"
        self.assertTrue(service_path.exists())
        service_text = service_path.read_text(encoding="utf-8")
        self.assertIn('"/certificates/"', service_text)
        self.assertIn('"/certificates/verify/', service_text)


if __name__ == "__main__":
    unittest.main()
