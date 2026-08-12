const User = require("../model/user");
const Role = require("../model/role");
const bcrypt = require("bcrypt");

const admin = async () => {
  try {
    // Check if admin already exists
    const adminExist = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });
    console.log(`Admin Data ${adminExist}`);

    if (adminExist) {
      console.log("Super admin already exists");
      return;
    }

    // Find admin role
    let adminRole = await Role.findOne({
      role: "admin",
    });

    // Create admin role if it doesn't exist
    if (!adminRole) {
      adminRole = await Role.create({
        role: "admin",
      });

      console.log("Admin role created");
    }

    // Generate salt
    const salt = await bcrypt.genSalt(10);

    // Hash admin password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    // Create admin user
    const data = await User.create({
      name: process.env.ADMIN_NAME,
      phone: process.env.ADMIN_PHONE,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: adminRole._id,
      provider: "local",
      isVerified: true,
      isActive: true,
    });

    console.log("Admin created successfully");
    console.log("Admin ID:", data._id);
  } catch (error) {
    console.error("Error creating super admin:", error);
  }
};

module.exports = admin;
