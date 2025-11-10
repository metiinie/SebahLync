import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home as HomeIcon, 
  Car, 
  Building, 
  ShoppingCart, 
  Heart, 
  Shield, 
  CheckCircle, 
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Search,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { fetchRecords } from '../lib/supabase';
import { Listing, User as UserType } from '../types';
import { formatPrice, formatRelativeTime, getCategoryIcon } from '../lib/utils';
import logoImage from '../components/Images/SebahLync__logo.png';

const Home: React.FC = () => {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalTransactions: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedListings();
    loadStats();
  }, []);

  const loadFeaturedListings = async () => {
    try {
      const listings = await fetchRecords<Listing>('listings', {
        filters: { status: 'approved', is_active: true },
        orderBy: { column: 'views', ascending: false },
        limit: 6,
      });
      setFeaturedListings(listings);
    } catch (error) {
      console.error('Failed to load featured listings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [users, listings, transactions] = await Promise.all([
        fetchRecords<UserType>('users', { filters: { is_active: true } }),
        fetchRecords<Listing>('listings', { filters: { status: 'approved' } }),
        fetchRecords('transactions', { filters: { status: 'completed' } }),
      ]);

      const totalValue = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);

      setStats({
        totalUsers: users.length,
        totalListings: listings.length,
        totalTransactions: transactions.length,
        totalValue,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center justify-center mb-6"
              >
                <img 
                  src={logoImage} 
                  alt="SebahLync" 
                  className="w-32 h-32 object-contain" 
                />
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Where Trust Meets Trade
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                SebahLync is your secure digital brokerage platform. Buy, rent, or sell 
                properties and vehicles with confidence through our escrow-based system 
                managed by verified admins.
              </p>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button asChild size="xl" variant="gold" className="group">
                <Link to="/buy">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  BUY
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button asChild size="xl" variant="default" className="group">
                <Link to="/rent">
                  <HomeIcon className="mr-2 h-5 w-5" />
                  RENT
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button asChild size="xl" variant="navy" className="group">
                <Link to="/sell">
                  <Building className="mr-2 h-5 w-5" />
                  SELL
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            {/* Quick Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for cars, houses, land..."
                  className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-[#F5B700] rounded-full"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full">
                  Search
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-[#F5B700]/20 rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-16 h-16 bg-[#0B132B]/20 rounded-full animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-200/20 rounded-full animate-pulse delay-2000" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <motion.div variants={itemVariants} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#0B132B] mb-2">
                {loading ? '...' : stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-gray-600 flex items-center justify-center">
                <Users className="h-4 w-4 mr-1" />
                Verified Users
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#0B132B] mb-2">
                {loading ? '...' : stats.totalListings.toLocaleString()}
              </div>
              <div className="text-gray-600 flex items-center justify-center">
                <Building className="h-4 w-4 mr-1" />
                Active Listings
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#0B132B] mb-2">
                {loading ? '...' : stats.totalTransactions.toLocaleString()}
              </div>
              <div className="text-gray-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Completed Deals
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#0B132B] mb-2">
                {loading ? '...' : formatPrice(stats.totalValue)}
              </div>
              <div className="text-gray-600 flex items-center justify-center">
                <Award className="h-4 w-4 mr-1" />
                Total Value
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Featured Listings */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Listings
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Discover the most popular and verified listings on our platform
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/buy">
                <Search className="mr-2 h-4 w-4" />
                Browse All Listings
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredListings.map((listing) => (
              <motion.div key={listing.id} variants={itemVariants}>
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={listing.images[0]?.url || '/placeholder-image.jpg'}
                      alt={listing.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="gold" className="flex items-center gap-1">
                        {getCategoryIcon(listing.category)}
                        {listing.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant={listing.type === 'sale' ? 'default' : 'secondary'}>
                        {listing.type}
                      </Badge>
                    </div>
                    {listing.verified && (
                      <div className="absolute bottom-4 right-4">
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {listing.location.city}, {listing.location.subcity}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-[#0B132B]">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="h-4 w-4" />
                        {listing.views}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatRelativeTime(listing.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/listing/${listing.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Button asChild size="lg" variant="outline">
              <Link to="/buy">
                View All Listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SebahLync?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of secure digital trading with our innovative platform
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Escrow</h3>
                <p className="text-gray-600">
                  Your funds are held securely until the transaction is completed and verified by our admin team.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Users</h3>
                <p className="text-gray-600">
                  All users and listings go through our verification process to ensure authenticity and quality.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiple Categories</h3>
                <p className="text-gray-600">
                  Buy, rent, or sell cars, houses, land, and commercial properties all in one platform.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-[#0B132B] to-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of verified users who trust SebahLync for their buying, renting, and selling needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="gold">
                <Link to="/register">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#0B132B]">
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;