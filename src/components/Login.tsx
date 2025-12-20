import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { Box, Typography, Paper, Container } from "@mui/material";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function Login() {
  const { login } = useAuth();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              PG Eats
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              Sign in with your @tryplayground.com email to continue
            </Typography>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  login(credentialResponse.credential);
                }
              }}
              onError={() => {
                console.error("Login Failed");
                alert("Login failed. Please try again.");
              }}
              useOneTap
            />
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              Only @tryplayground.com emails are authorized
            </Typography>
          </Paper>
        </Box>
      </Container>
    </GoogleOAuthProvider>
  );
}
