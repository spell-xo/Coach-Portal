import React from "react";
import { useNavigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Typography, TextField, Button, Link, Alert, CircularProgress } from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { setCredentials, setLoading, setError, selectIsLoading, selectAuthError, setAvailableContexts } from "../store/authSlice";
import authService from "../api/authService";
import contextService from "../api/contextService";
import { icons } from "../styles/icons";

const HARDCODED_FALLBACK_CLUB_ID = "6904a5c7457394b8e39d4307";
const DEFAULT_CLUB_ID = process.env.REACT_APP_DEFAULT_CLUB_ID || HARDCODED_FALLBACK_CLUB_ID;

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isLoading = useSelector(selectIsLoading);
  const authError = useSelector(selectAuthError);

  const handleSubmit = async (values, { setSubmitting }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    // DEBUG: Log all URL parameters
    const allParams = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log("[Login] URL Parameters:", allParams);
    console.log("[Login] Redirect param:", searchParams.get("redirect"));
    console.log("[Login] Token param:", searchParams.get("token"));

    try {
      const response = await authService.login({
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        // Store credentials with activeContext properly extracted
        dispatch(
          setCredentials({
            ...response.data,
            activeContext: response.data.user.activeContext,
          })
        );

        // Check if there's an invitation token to accept
        const token = searchParams.get("token");
        if (token) {
          try {
            const inviteResponse = await authService.acceptInvitation(token);
            if (inviteResponse.success) {
              // Refresh contexts after accepting invitation
              const contextResponse = await contextService.listContexts();
              if (contextResponse.success && contextResponse.data.contexts) {
                dispatch(setAvailableContexts(contextResponse.data.contexts));
              }

              // Redirect to club dashboard
              const clubId = inviteResponse.data.clubId;
              if (clubId) {
                navigate(`/clubs/${clubId}/dashboard`);
                return;
              }
            }
          } catch (inviteError) {
            console.error("Error accepting invitation:", inviteError);
            const errorMessage = inviteError.response?.data?.message || "Failed to accept invitation";
            dispatch(setError(errorMessage));
            dispatch(setLoading(false));
            setSubmitting(false);
            return;
          }
        }

        // Fetch available contexts for the user
        try {
          const contextResponse = await contextService.listContexts();
          if (contextResponse.success && contextResponse.data.contexts) {
            dispatch(setAvailableContexts(contextResponse.data.contexts));
          }
        } catch (contextError) {
          console.error("Error fetching contexts:", contextError);
          // Non-critical error - continue with login
        }

        // Smart routing based on context and roles
        const redirectParam = searchParams.get("redirect");
        const { roles, primaryRole, activeContext, featureAccess } = response.data.user;

        console.log("[Login Debug] Redirect logic:", {
          redirectParam,
          activeContext,
          primaryRole,
          roles,
          dawTier: featureAccess?.daw?.tier,
        });

        let redirectTo;
        if (redirectParam) {
          // If there's a redirect parameter (e.g., from invitation), use it
          console.log("[Login Debug] Using redirect parameter:", redirectParam);
          redirectTo = redirectParam;
        } else {
          // Smart routing based on primary role or roles array
          const userRoles = roles || [response.data.user.role]; // Fallback to legacy role field
          const activeRole = primaryRole || response.data.user.role;
          const isPlatformEngineering = featureAccess?.daw?.tier === "platform_engineering" || featureAccess?.daw?.tier === "platform_engineering_admin";

          if (activeRole === "superadmin" || isPlatformEngineering || userRoles.some(r => r.role === "superadmin")) {
            redirectTo = "/superadmin/dashboard"; // Superadmin dashboard
          } else if (activeRole === "player" || userRoles.includes("player")) {
            // Players always go to player dashboard regardless of club context
            redirectTo = "/player/dashboard"; // Player dashboard
          } else if (activeContext && activeContext.type === "club" && activeContext.clubId) {
            // Coaches/staff with club context go to club dashboard
            console.log("[Login Debug] Using club context:", activeContext);
            redirectTo = `/clubs/${activeContext.clubId}/dashboard`;
          } else if (activeRole === "coach" || userRoles.includes("coach")) {
            redirectTo = `/clubs/${DEFAULT_CLUB_ID}/dashboard`; // Coach fallback to club dashboard
          } else {
            redirectTo = "/"; // Fallback to home
          }
          console.log("[Login Debug] Using role-based routing:", redirectTo);
        }

        console.log("[Login Debug] Final redirect to:", redirectTo);
        navigate(redirectTo);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Login failed. Please try again.";
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
      setSubmitting(false);
    }
  };

  return (
    <section className="login">
      <div className="login__left">
        <div className="login__left-inner">
          <div className="login__logo">{icons["aim-full"]}</div>
          <div className="login__left-content">
            <p className="login__title">
              Transform Your Coaching
              <br />
              With AI Intelligence
            </p>
            <p className="login__subtitle">
              Empower your players with data-driven insights and <br />
              personalized training programs powered by artificial intelligence
            </p>
            <div className="login__list">
              {[
                { icon: "📊", text: "Real-time Performance Analytics" },
                { icon: "🎥", text: "AI-Powered Video Analysis" },
                { icon: "🎯", text: "Personalized Development Plans" },
              ].map((feature, index) => (
                <div
                  className="login__list-item"
                  key={feature.text}>
                  <div className="login__list-icon">{feature.icon}</div>
                  <p className="login__list-text">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="login__footer">Trusted by coaches and clubs worldwide</p>
        </div>
      </div>
      {/* Right Side - Login Form */}
      <div className="auth">
        <div>
          <div className="login__logo">{icons["aim-full"]}</div>
          <div className="auth__form">
            <Box>
              <Typography
                component="h1"
                variant="h3"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: "#1A1A1A",
                  fontSize: { xs: "2rem", md: "2.5rem" },
                }}>
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.95rem", md: "1.05rem" },
                }}>
                Sign in to access your coaching dashboard
              </Typography>
            </Box>

            {authError && (
              <Alert
                severity="error"
                sx={{
                  mb: 1,
                  borderRadius: "8px",
                }}>
                {authError}
              </Alert>
            )}

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}>
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Field
                    as={TextField}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        backgroundColor: "#FAFBFC",
                        fontSize: { xs: "1rem", md: "1.05rem" },
                        "& input": {
                          py: { xs: 1.5, md: 2 },
                        },
                        "&:hover": {
                          backgroundColor: "#F5F7FA",
                        },
                        "&.Mui-focused": {
                          backgroundColor: "#fff",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "1rem", md: "1.05rem" },
                      },
                    }}
                  />
                  <Field
                    as={TextField}
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    sx={{
                      mb: 4,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        backgroundColor: "#FAFBFC",
                        fontSize: { xs: "1rem", md: "1.05rem" },
                        "& input": {
                          py: { xs: 1.5, md: 2 },
                        },
                        "&:hover": {
                          backgroundColor: "#F5F7FA",
                        },
                        "&.Mui-focused": {
                          backgroundColor: "#fff",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "1rem", md: "1.05rem" },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading || isSubmitting}
                    sx={{
                      mb: 2,
                      py: { xs: 1.75, md: 2.25 },
                      fontSize: { xs: "1rem", md: "1.1rem" },
                      fontWeight: 600,
                      borderRadius: "12px",
                      textTransform: "none",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      "&:hover": {
                        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
                      },
                    }}>
                    {isLoading || isSubmitting ? (
                      <CircularProgress
                        size={26}
                        sx={{ color: "#fff" }}
                      />
                    ) : (
                      "Sign In to Dashboard"
                    )}
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
          {/* Footer Note */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 5,
              color: "text.secondary",
              fontSize: { xs: "0.85rem", md: "0.9rem" },
            }}>
            By signing in, you agree to <br /> our Terms of Service and Privacy Policy
          </Typography>
        </div>
      </div>
    </section>
  );
};

export default Login;
