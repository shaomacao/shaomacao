import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Toast } from "./components/ui/toast";
import { AlertCircle, Users, Globe, Shield, Heart, MessageCircle, Plus, Search, User, LogOut, Home } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// World cities data
const WORLD_CITIES = [
  "Addis Ababa", "Adelaide", "Ahmedabad", "Alexandria", "Algiers", "Almaty",
  "Amsterdam", "Ankara", "Athens", "Atlanta", "Auckland", "Baghdad", "Baku",
  "Bangkok", "Barcelona", "Beijing", "Belgrade", "Berlin", "Birmingham", 
  "Bogotá", "Boston", "Brisbane", "Brussels", "Bucharest", "Budapest",
  "Buenos Aires", "Cairo", "Calgary", "Cape Town", "Caracas", "Casablanca",
  "Chennai", "Chicago", "Cologne", "Copenhagen", "Dallas", "Damascus", "Delhi",
  "Detroit", "Dhaka", "Dubai", "Dublin", "Düsseldorf", "Edinburgh", "Frankfurt",
  "Geneva", "Glasgow", "Guadalajara", "Hamburg", "Helsinki", "Ho Chi Minh City",
  "Hong Kong", "Houston", "Istanbul", "Jakarta", "Johannesburg", "Karachi",
  "Kiev", "Kuala Lumpur", "Lagos", "Lahore", "Lima", "Lisbon", "London",
  "Los Angeles", "Lyon", "Madrid", "Manchester", "Manila", "Melbourne",
  "Mexico City", "Miami", "Milan", "Minneapolis", "Montreal", "Moscow",
  "Mumbai", "Munich", "Nairobi", "New York", "Oslo", "Paris", "Perth",
  "Philadelphia", "Phoenix", "Prague", "Riyadh", "Rome", "San Francisco",
  "Santiago", "São Paulo", "Seoul", "Shanghai", "Singapore", "Stockholm",
  "Sydney", "Taipei", "Tehran", "Tel Aviv", "Tokyo", "Toronto", "Vancouver",
  "Vienna", "Warsaw", "Washington", "Zurich"
];

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // Verify token and get user info if needed
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  return (
    <div className="App">
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-8 w-8 text-blue-600" />
                    <h1 className="text-2xl font-bold text-blue-900">SHAO MACAO</h1>
                  </div>
                </div>
                
                <nav className="hidden md:flex items-center space-x-6">
                  <Button 
                    variant={currentPage === 'home' ? 'default' : 'ghost'}
                    onClick={() => setCurrentPage('home')}
                    className="flex items-center space-x-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Button>
                  
                  {user && (
                    <>
                      <Button 
                        variant={currentPage === 'search' ? 'default' : 'ghost'}
                        onClick={() => setCurrentPage('search')}
                        className="flex items-center space-x-2"
                      >
                        <Search className="h-4 w-4" />
                        <span>Search</span>
                      </Button>
                      
                      <Button 
                        variant={currentPage === 'applications' ? 'default' : 'ghost'}
                        onClick={() => setCurrentPage('applications')}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>My Applications</span>
                      </Button>
                      
                      <Button 
                        variant={currentPage === 'profile' ? 'default' : 'ghost'}
                        onClick={() => setCurrentPage('profile')}
                        className="flex items-center space-x-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        onClick={logout}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </Button>
                    </>
                  )}
                </nav>
                
                {!user && (
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost"
                      onClick={() => setCurrentPage('login')}
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => setCurrentPage('register')}
                    >
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={
                currentPage === 'home' ? <HomePage /> :
                currentPage === 'login' ? <LoginPage setUser={setUser} setToken={setToken} setCurrentPage={setCurrentPage} /> :
                currentPage === 'register' ? <RegisterPage setUser={setUser} setToken={setToken} setCurrentPage={setCurrentPage} /> :
                currentPage === 'search' && user ? <SearchPage user={user} token={token} /> :
                currentPage === 'applications' && user ? <ApplicationsPage user={user} token={token} /> :
                currentPage === 'profile' && user ? <ProfilePage user={user} token={token} /> :
                <HomePage />
              } />
              <Route path="/user/:userId" element={user ? <UserProfilePage user={user} token={token} /> : <Navigate to="/" />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-blue-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">About SHAO MACAO</h3>
                  <p className="text-blue-200">
                    A global platform connecting individuals for mutual cash transactions and 
                    non-cash transfers within local banking systems worldwide.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Our Mission</h3>
                  <p className="text-blue-200">
                    Building trust through gentleman's agreements and encouraging 
                    financial hygiene practices among our global community.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact</h3>
                  <p className="text-blue-200">
                    For feedback and support:
                    <br />
                    <a href="mailto:askme@shaomacao.com" className="text-yellow-300 hover:text-yellow-400">
                      askme@shaomacao.com
                    </a>
                  </p>
                </div>
              </div>
              
              <Separator className="my-8 bg-blue-800" />
              
              <div className="text-center text-blue-300">
                <p>© 2025 SHAO MACAO. All rights reserved.</p>
                <p className="mt-2 text-sm">
                  We are not responsible for transactions between registered users. 
                  Please maintain financial hygiene and practice due diligence.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </div>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-blue-900">
          Global Financial Connections
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Connect with trusted individuals worldwide for mutual cash transactions 
          and non-cash transfers within local banking systems.
        </p>
        
        {/* Warning Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">Important Reminder</h3>
              <p className="text-yellow-700">
                All transactions are based on personal responsibility and trust. Please maintain 
                proper financial hygiene, verify all details, and exercise due diligence before 
                any financial commitments. SHAO MACAO is not responsible for transactions between users.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Trusted Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Connect with verified users who have earned trust through our community rating system.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Global Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Access a network spanning major cities worldwide with populations over 1 million.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Safe Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              All transfers occur within established banking systems for maximum security.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Register</h3>
            <p className="text-sm text-gray-600">Create your account with verified information</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">Search</h3>
            <p className="text-sm text-gray-600">Find counterparties in your target city</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Connect</h3>
            <p className="text-sm text-gray-600">Review profiles and contact trusted users</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">4</span>
            </div>
            <h3 className="font-semibold mb-2">Transfer</h3>
            <p className="text-sm text-gray-600">Complete mutual transfers safely</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login Page Component
function LoginPage({ setUser, setToken, setCurrentPage }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/login`, formData);
      
      const { user, access_token } = response.data;
      setUser(user);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentPage('search');
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your SHAO MACAO account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentPage('register')}
            >
              Don't have an account? Register here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Register Page Component  
function RegisterPage({ setUser, setToken, setCurrentPage }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    date_of_birth: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/register`, {
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).toISOString()
      });
      
      const { user, access_token } = response.data;
      setUser(user);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentPage('search');
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Join SHAO MACAO</CardTitle>
          <CardDescription>Create your account to start connecting globally</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1234567890"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select onValueChange={(value) => setFormData({...formData, city: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORLD_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth (Must be 21+)</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentPage('login')}
            >
              Already have an account? Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Search Page Component
function SearchPage({ user, token }) {
  const [targetCity, setTargetCity] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencyRates, setCurrencyRates] = useState({});

  const searchApplications = async () => {
    if (!targetCity) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/applications/search?target_city=${targetCity}&token=${token}`);
      setApplications(response.data.applications);
      
      // Get currency rates
      const ratesResponse = await axios.get(`${API}/currency/rates/USD`);
      setCurrencyRates(ratesResponse.data.rates);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Counterparties</CardTitle>
          <CardDescription>
            Search for users in your target city who are looking for counterparties in {user.city}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="target-city">Target City</Label>
              <Select onValueChange={setTargetCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city to search in" />
                </SelectTrigger>
                <SelectContent>
                  {WORLD_CITIES.filter(city => city !== user.city).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={searchApplications} disabled={!targetCity || loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {applications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Available Applications</h3>
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} currencyRates={currencyRates} />
          ))}
        </div>
      )}
      
      {applications.length === 0 && targetCity && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No applications found for {targetCity}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Application Card Component
function ApplicationCard({ application, currencyRates }) {
  const { user: appUser, amount, currency, days_active, status } = application;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {appUser.first_name} {appUser.last_name}
                </h3>
                <p className="text-sm text-gray-600">#{appUser.business_card_number}</p>
              </div>
              {appUser.is_trusted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Trusted
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">{appUser.city}, {appUser.country}</p>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <p className="font-medium">${amount.toLocaleString()} {currency}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="font-medium">{appUser.phone}</p>
              </div>
              <div>
                <span className="text-gray-500">Active for:</span>
                <p className="font-medium">{days_active} days</p>
              </div>
            </div>
            
            {currencyRates && Object.keys(currencyRates).length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium mb-2">Current Exchange Rates (USD base)</h4>
                <div className="text-xs text-gray-600 grid grid-cols-3 gap-2">
                  <span>EUR: {currencyRates.EUR?.toFixed(4)}</span>
                  <span>GBP: {currencyRates.GBP?.toFixed(4)}</span>
                  <span>JPY: {currencyRates.JPY?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
              {status}
            </Badge>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">View Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <UserProfileDialog user={appUser} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// User Profile Dialog Component
function UserProfileDialog({ user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(user.likes_count || 0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadUserProfile();
  }, [user.id]);

  const loadUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/${user.id}?token=${token}`);
      setComments(response.data.comments);
      setHasLiked(response.data.has_liked);
      setLikesCount(response.data.likes_count);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axios.post(`${API}/likes/${user.id}?token=${token}`);
      setHasLiked(!hasLiked);
      setLikesCount(response.data.likes_count);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(`${API}/comments?token=${token}`, {
        target_user_id: user.id,
        content: newComment
      });
      setNewComment('');
      loadUserProfile(); // Reload to get new comment
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>User Profile</DialogTitle>
        <DialogDescription>#{user.business_card_number}</DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{user.first_name} {user.last_name}</h3>
            <p className="text-gray-600">{user.city}, {user.country}</p>
            <p className="text-sm text-gray-500">{user.phone}</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Button
                variant={hasLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="flex items-center space-x-1"
              >
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </Button>
              {user.is_trusted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Trusted
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3 flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Comments ({comments.length})
          </h4>
          
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button type="submit" size="sm">
                Post
              </Button>
            </div>
          </form>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-md p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{comment.commenter_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-gray-500 text-sm">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Applications Page Component
function ApplicationsPage({ user, token }) {
  const [applications, setApplications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/my/applications?token=${token}`);
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Applications</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Application</span>
        </Button>
      </div>

      {showCreateForm && (
        <CreateApplicationForm 
          user={user} 
          token={token} 
          onClose={() => setShowCreateForm(false)}
          onSuccess={loadApplications}
        />
      )}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Looking for counterparty in {app.target_city}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Amount: ${app.amount.toLocaleString()} {app.currency}</p>
                      <p>Created: {new Date(app.created_at).toLocaleDateString()}</p>
                      <p>Active for: {app.days_active} days</p>
                    </div>
                  </div>
                  <Badge variant={app.status === 'Active' ? 'default' : 'secondary'}>
                    {app.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {applications.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No applications yet. Create one to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Create Application Form Component
function CreateApplicationForm({ user, token, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    target_city: '',
    amount: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/applications?token=${token}`, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Application</CardTitle>
        <CardDescription>Looking for a counterparty from your city: {user.city}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="target_city">Target City</Label>
            <Select onValueChange={(value) => setFormData({...formData, target_city: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select city where you need counterparty" />
              </SelectTrigger>
              <SelectContent>
                {WORLD_CITIES.filter(city => city !== user.city).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Max $6,000)</Label>
              <Input
                id="amount"
                type="number"
                max="6000"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select onValueChange={(value) => setFormData({...formData, currency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="USD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Application'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Profile Page Component
function ProfilePage({ user, token }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Your SHAO MACAO account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Card Number</Label>
              <p className="font-mono text-lg">#{user.business_card_number}</p>
            </div>
            <div className="text-right">
              {user.is_trusted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="h-4 w-4 mr-2" />
                  Trusted Member
                </Badge>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p>{user.first_name} {user.last_name}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{user.email}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p>{user.phone}</p>
            </div>
            <div>
              <Label>Location</Label>
              <p>{user.city}, {user.country}</p>
            </div>
            <div>
              <Label>Member Since</Label>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <Label>Likes Received</Label>
              <p className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{user.likes_count || 0}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;