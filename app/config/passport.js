const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/user");
const Role = require("../model/role");

["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"].forEach(
  (name) => {
    if (!process.env[name]) {
      throw new Error(`Missing required Google environment variable: ${name}`);
    }
  }
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? process.env.GOOGLE_CALLBACK_LIVE_URL
          : process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.emails || !profile.emails.length) {
          return done(new Error("Google profile missing email"), null);
        }

        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        if (!user) {
          const roles = await Role.find();
          console.log("All roles:", roles);

          let userRole = await Role.findOne({ role: "user" });
          console.log("User role:", userRole);

          if (!userRole) {
            console.warn("User role not found: creating default user role");
            userRole = await Role.create({ role: "user" });
          }

          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            provider: "google",
            isVerified: true,
            role: userRole._id,
          });
        }

        return done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("role");
    done(null, user);
  } catch (error) {
    done(error);
  }
});
