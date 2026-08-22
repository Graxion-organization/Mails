import axios from 'axios';

/**
 * @desc    Get current user profile (Proxied from Auth service)
 * @route   GET /api/user/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const authUrl = process.env.GRAXION_AUTH_URL || 'http://localhost:6000';
    
    // Forward the authorization header to the Auth service
    const response = await axios.get(`${authUrl}/api/profile`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching profile from Auth service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Error fetching profile from Auth service',
    });
  }
};
