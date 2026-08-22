/**
 * @desc    Get current user profile (Proxied from Auth service)
 * @route   GET /api/user/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const authUrl = process.env.GRAXION_AUTH_URL || 'http://localhost:6000';
    
    // Forward the authorization header to the Auth service using native fetch
    const response = await fetch(`${authUrl}/api/profile`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      const text = await response.text();
      console.error(`Expected JSON from ${authUrl}/api/profile but got:`, text.substring(0, 100));
      return res.status(502).json({
        success: false,
        message: 'Auth service returned an invalid response. Please check backend configuration.',
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: errorData.message || 'Error fetching profile from Auth service',
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching profile from Auth service:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile',
    });
  }
};
