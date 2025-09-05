"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/src/contexts/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { register, loading } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      toast.error(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      );
      return false;
    }

    if (formData.username.length < 3 || formData.username.length > 30) {
      toast.error("Username must be between 3 and 30 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      toast.error(
        "Username can only contain letters, numbers, underscores and hyphens"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword: _, ...registrationData } = formData;
    const success = await register(registrationData);
    if (success) {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl">Sign Up</CardTitle>
          <CardDescription className="text-center">
            Create your account to track your game statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange}
                required
                autoComplete="username"
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_-]+$"
              />
              <p className="text-muted-foreground text-xs">
                3-30 characters, letters, numbers, underscores and hyphens only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-muted-foreground text-xs">
                At least 6 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>

            <div className="text-muted-foreground text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
