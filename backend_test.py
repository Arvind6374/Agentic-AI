import requests
import sys
import json
from datetime import datetime
import time

class TradeAnalyticsAPITester:
    def __init__(self, base_url="https://commerce-dashboard-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.api_base}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            print(f"\n🔍 Testing {name}...")
            print(f"   URL: {url}")
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}, Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'non-dict response'}")
                    return True, response_data
                except json.JSONDecodeError:
                    self.log_test(name, True, f"Status: {response.status_code}, Non-JSON response")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.text
                    error_msg += f", Response: {error_data[:200]}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "/health")

    def test_schema_endpoint(self):
        """Test schema endpoint"""
        success, data = self.run_test("Schema Endpoint", "GET", "/schema")
        if success and data:
            # Verify schema structure
            if "shipment_records" in data and "trade_summary" in data:
                self.log_test("Schema Structure Validation", True, "Contains expected tables: shipment_records, trade_summary")
                
                # Check shipment_records table structure
                sr_table = data.get("shipment_records", {})
                if "columns" in sr_table and "row_count" in sr_table:
                    columns = sr_table.get("columns", [])
                    expected_cols = ["exporter_name", "importer_name", "commodity", "trade_value_usd"]
                    found_cols = [col.get("name") for col in columns if isinstance(col, dict)]
                    has_key_cols = all(col in found_cols for col in expected_cols)
                    
                    self.log_test("Schema Key Columns Check", has_key_cols, 
                                f"Found {len(found_cols)} columns, key columns present: {has_key_cols}")
                else:
                    self.log_test("Schema Table Structure", False, "Missing columns or row_count in shipment_records")
            else:
                self.log_test("Schema Structure Validation", False, "Missing expected tables")
        return success, data

    def test_query_endpoint(self):
        """Test query endpoint with different question types"""
        test_cases = [
            {
                "name": "Basic Query - Top Exporters",
                "question": "Top 5 coffee exporters by trade value",
                "expected_keys": ["data", "sql", "total_rows", "intent"]
            },
            {
                "name": "Trend Query",
                "question": "Month-wise rice trade trend in 2024", 
                "expected_keys": ["data", "chart_data", "summary"]
            },
            {
                "name": "Sourcing Query",
                "question": "Source me 1121 Basmati rice suppliers",
                "expected_keys": ["data", "sql", "intent"]
            },
            {
                "name": "Comparison Query", 
                "question": "Compare India and Vietnam coffee exports",
                "expected_keys": ["data", "chart_data", "summary"]
            }
        ]

        for test_case in test_cases:
            session_id = f"test-session-{int(time.time())}"
            payload = {
                "question": test_case["question"],
                "session_id": session_id
            }
            
            success, data = self.run_test(
                test_case["name"], 
                "POST", 
                "/query", 
                data=payload
            )
            
            if success and data:
                # Validate response structure
                missing_keys = [key for key in test_case["expected_keys"] if key not in data]
                if not missing_keys:
                    self.log_test(f"{test_case['name']} - Structure", True, 
                                f"All expected keys present: {test_case['expected_keys']}")
                else:
                    self.log_test(f"{test_case['name']} - Structure", False, 
                                f"Missing keys: {missing_keys}")
                
                # Validate data content
                if "data" in data and isinstance(data["data"], list) and len(data["data"]) > 0:
                    self.log_test(f"{test_case['name']} - Data Content", True, 
                                f"Returned {len(data['data'])} records")
                else:
                    self.log_test(f"{test_case['name']} - Data Content", False, 
                                "No data or empty data array")

    def test_entity_profile_endpoint(self):
        """Test entity profile endpoint"""
        test_entities = [
            ("OLAM INTERNATIONAL LTD", "exporter"),
            ("TATA COFFEE LTD", "exporter"),
            ("NESTLE SA", "importer")
        ]
        
        for name, entity_type in test_entities:
            success, data = self.run_test(
                f"Entity Profile - {name}",
                "GET",
                f"/entity-profile?name={name}&type={entity_type}"
            )
            
            if success and data:
                # Validate profile structure
                expected_keys = ["name", "type", "overview"]
                missing_keys = [key for key in expected_keys if key not in data]
                
                if not missing_keys:
                    self.log_test(f"Entity Profile Structure - {name}", True, 
                                "Contains expected keys: name, type, overview")
                    
                    # Check overview structure
                    overview = data.get("overview", {})
                    overview_keys = ["summary", "kpis", "top_commodity"]
                    has_overview_keys = all(key in overview for key in overview_keys)
                    
                    self.log_test(f"Entity Overview Structure - {name}", has_overview_keys,
                                f"Overview keys present: {has_overview_keys}")
                else:
                    self.log_test(f"Entity Profile Structure - {name}", False,
                                f"Missing keys: {missing_keys}")

    def test_cors_headers(self):
        """Test CORS configuration"""
        try:
            response = requests.options(f"{self.api_base}/schema")
            has_cors = 'access-control-allow-origin' in response.headers
            self.log_test("CORS Headers", has_cors, 
                        f"CORS headers present: {has_cors}")
        except Exception as e:
            self.log_test("CORS Headers", False, f"Error testing CORS: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🚀 STARTING ARTHASHASTRA INTELLIGENCE API TESTING")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"API Base: {self.api_base}")
        print()

        # Core API tests
        self.test_health_check()
        self.test_schema_endpoint()
        self.test_query_endpoint()
        self.test_entity_profile_endpoint()
        self.test_cors_headers()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return 0
        else:
            print("⚠️  SOME TESTS FAILED")
            return 1

def main():
    tester = TradeAnalyticsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())