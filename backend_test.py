import requests
import sys
import json
from datetime import datetime, timedelta
import time

class SHAOMacaoAPITester:
    def __init__(self, base_url="https://cashbuddy-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": f"test_user_{int(time.time())}@example.com",
            "phone": "+1234567890",
            "country": "USA",
            "city": "New York",
            "date_of_birth": "1990-01-01T00:00:00Z",
            "password": "TestPass123!"
        }
        self.test_user_data_underage = {
            "first_name": "Jane",
            "last_name": "Young",
            "email": f"young_user_{int(time.time())}@example.com",
            "phone": "+1234567891",
            "country": "USA",
            "city": "Los Angeles",
            "date_of_birth": "2010-01-01T00:00:00Z",  # Only 15 years old
            "password": "TestPass123!"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        if self.token and 'Authorization' not in default_headers:
            default_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, params=params, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, params=params, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, params=params, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Expected {expected_status}, got {response.status_code}")
                try:
                    response_data = response.json()
                    if 'message' in response_data:
                        print(f"   Message: {response_data['message']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                    return False, error_data
                except:
                    print(f"   Response: {response.text}")
                    return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_cities_endpoint(self):
        """Test cities endpoint"""
        success, response = self.run_test("Cities Endpoint", "GET", "cities", 200)
        if success and 'cities' in response:
            cities = response['cities']
            print(f"   Found {len(cities)} cities")
            if len(cities) > 0:
                print(f"   Sample cities: {cities[:5]}")
            return True
        return False

    def test_currency_rates(self):
        """Test currency rates endpoint"""
        success, response = self.run_test("Currency Rates", "GET", "currency/rates/USD", 200)
        if success and 'rates' in response:
            rates = response['rates']
            print(f"   Found rates for {len(rates)} currencies")
            sample_rates = {k: v for k, v in list(rates.items())[:5]}
            print(f"   Sample rates: {sample_rates}")
            return True
        return False

    def test_register_underage_user(self):
        """Test registration with underage user (should fail)"""
        success, response = self.run_test(
            "Register Underage User (Should Fail)", 
            "POST", 
            "register", 
            422,  # Validation error expected
            data=self.test_user_data_underage
        )
        return not success  # We expect this to fail

    def test_register_user(self):
        """Test user registration"""
        success, response = self.run_test(
            "Register User", 
            "POST", 
            "register", 
            200, 
            data=self.test_user_data
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'user' in response:
                self.user_id = response['user']['id']
                business_card = response['user'].get('business_card_number', '')
                print(f"   User ID: {self.user_id}")
                print(f"   Business Card: {business_card}")
            return True
        return False

    def test_register_duplicate_user(self):
        """Test registration with duplicate email (should fail)"""
        success, response = self.run_test(
            "Register Duplicate User (Should Fail)", 
            "POST", 
            "register", 
            400,  # Bad request expected
            data=self.test_user_data
        )
        return not success  # We expect this to fail

    def test_login_user(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        success, response = self.run_test("Login User", "POST", "login", 200, data=login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials (should fail)"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": "wrongpassword"
        }
        success, response = self.run_test(
            "Login Invalid Credentials (Should Fail)", 
            "POST", 
            "login", 
            401, 
            data=login_data
        )
        return not success  # We expect this to fail

    def test_create_application(self):
        """Test creating an application"""
        if not self.token:
            print("❌ No token available for application creation")
            return False
            
        app_data = {
            "target_city": "London",
            "amount": 1500.00,
            "currency": "USD"
        }
        success, response = self.run_test(
            "Create Application", 
            "POST", 
            "applications", 
            200, 
            data=app_data,
            params={"token": self.token}
        )
        if success and 'application' in response:
            app = response['application']
            print(f"   Application ID: {app.get('id')}")
            print(f"   Amount: ${app.get('amount')} {app.get('currency')}")
            print(f"   Target City: {app.get('target_city')}")
            return True
        return False

    def test_create_application_over_limit(self):
        """Test creating application over $6000 limit (should fail)"""
        if not self.token:
            print("❌ No token available for application creation")
            return False
            
        app_data = {
            "target_city": "Paris",
            "amount": 7000.00,  # Over limit
            "currency": "USD"
        }
        success, response = self.run_test(
            "Create Application Over Limit (Should Fail)", 
            "POST", 
            "applications", 
            422,  # Validation error expected
            data=app_data,
            params={"token": self.token}
        )
        return not success  # We expect this to fail

    def test_get_my_applications(self):
        """Test getting user's applications"""
        if not self.token:
            print("❌ No token available for getting applications")
            return False
            
        success, response = self.run_test(
            "Get My Applications", 
            "GET", 
            "my/applications", 
            200,
            params={"token": self.token}
        )
        if success and 'applications' in response:
            apps = response['applications']
            print(f"   Found {len(apps)} applications")
            return True
        return False

    def test_search_applications(self):
        """Test searching for applications"""
        if not self.token:
            print("❌ No token available for searching applications")
            return False
            
        success, response = self.run_test(
            "Search Applications", 
            "GET", 
            "applications/search", 
            200,
            params={"target_city": "Tokyo", "token": self.token}
        )
        if success and 'applications' in response:
            apps = response['applications']
            print(f"   Found {len(apps)} matching applications")
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.token or not self.user_id:
            print("❌ No token or user_id available for profile test")
            return False
            
        success, response = self.run_test(
            "Get User Profile", 
            "GET", 
            f"user/{self.user_id}", 
            200,
            params={"token": self.token}
        )
        if success and 'user' in response:
            user = response['user']
            print(f"   User: {user.get('first_name')} {user.get('last_name')}")
            print(f"   Business Card: {user.get('business_card_number')}")
            print(f"   Likes: {response.get('likes_count', 0)}")
            print(f"   Trusted: {user.get('is_trusted', False)}")
            return True
        return False

    def test_add_comment(self):
        """Test adding a comment to user profile"""
        if not self.token or not self.user_id:
            print("❌ No token or user_id available for comment test")
            return False
            
        comment_data = {
            "target_user_id": self.user_id,
            "content": "Great user to work with! Very reliable."
        }
        success, response = self.run_test(
            "Add Comment", 
            "POST", 
            "comments", 
            200,
            data=comment_data,
            params={"token": self.token}
        )
        if success and 'comment' in response:
            comment = response['comment']
            print(f"   Comment ID: {comment.get('id')}")
            print(f"   Content: {comment.get('content')}")
            return True
        return False

    def test_toggle_like(self):
        """Test toggling like on user profile"""
        if not self.token or not self.user_id:
            print("❌ No token or user_id available for like test")
            return False
            
        success, response = self.run_test(
            "Toggle Like", 
            "POST", 
            f"likes/{self.user_id}", 
            200,
            params={"token": self.token}
        )
        if success:
            print(f"   Message: {response.get('message')}")
            print(f"   Likes Count: {response.get('likes_count')}")
            print(f"   Is Trusted: {response.get('is_trusted')}")
            return True
        return False

    def test_like_self(self):
        """Test liking yourself (should fail)"""
        if not self.token or not self.user_id:
            print("❌ No token or user_id available for self-like test")
            return False
            
        success, response = self.run_test(
            "Like Self (Should Fail)", 
            "POST", 
            f"likes/{self.user_id}", 
            400,  # Bad request expected
            params={"token": self.token}
        )
        return not success  # We expect this to fail

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SHAO MACAO API Tests")
        print("=" * 50)
        
        # Basic endpoint tests
        self.test_root_endpoint()
        self.test_cities_endpoint()
        self.test_currency_rates()
        
        # Registration tests
        self.test_register_underage_user()
        self.test_register_user()
        self.test_register_duplicate_user()
        
        # Authentication tests
        self.test_login_user()
        self.test_login_invalid_credentials()
        
        # Application tests
        self.test_create_application()
        self.test_create_application_over_limit()
        self.test_get_my_applications()
        self.test_search_applications()
        
        # User profile tests
        self.test_get_user_profile()
        self.test_add_comment()
        self.test_toggle_like()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            failed = self.tests_run - self.tests_passed
            print(f"❌ {failed} tests failed")
            return 1

def main():
    tester = SHAOMacaoAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())