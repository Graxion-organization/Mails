/**
 * @desc    Get current user profile (Proxied from Auth service)
 * @route   GET /api/user/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const authUrl = process.env.GRAXION_AUTH_URL || 'http://localhost:6000';
    
    let token = req.headers.authorization;
    if (!token && req.cookies?.graxion_access_token) {
      token = `Bearer ${req.cookies.graxion_access_token}`;
    }

    // Forward the authorization header to the Auth service using native fetch
    const response = await fetch(`${authUrl}/api/profile`, {
      headers: {
        Authorization: token
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

/**
 * @desc    Set session cookie (BFF approach)
 * @route   POST /api/user/set-session
 * @access  Public
 */
export const setSession = (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('graxion_access_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax', // Use 'none' for cross-domain in production if needed, or 'lax'
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ success: true, message: 'Session created' });
};

/**
 * @desc    Clear session cookie
 * @route   POST /api/user/logout
 * @access  Public
 */
export const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('graxion_access_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0)
  });

  res.json({ success: true, message: 'Logged out successfully' });
};
