"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { User, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  _id: string;
  username: string;
  email?: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  avatar?: string;
  bio?: string;
  createdAt: string;
  rank?: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserStats | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const getAuthHeaders = (): Record<string, string> | null => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchProfile = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const [profileResponse, rankResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/profile`,
          {
            headers,
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/leaderboard/my/rank`,
          {
            headers,
          }
        ),
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userData = profileData.data.user;

        if (rankResponse.ok) {
          const rankData = await rankResponse.json();
          userData.rank = rankData.data.rank;
        }

        setUser(userData);
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          bio: userData.bio || "",
          avatar: userData.avatar || "",
        });
      } else if (profileResponse.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/profile`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((error: { msg: string }) => {
            toast.error(error.msg);
          });
        } else {
          toast.error(data.message || "Update failed");
        }
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/");
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        toast.success("Avatar uploaded successfully!");
      } else {
        toast.error(data.message || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/avatar`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        toast.success("Avatar deleted successfully!");
      } else {
        toast.error(data.message || "Failed to delete avatar");
      }
    } catch (error) {
      console.error("Avatar delete error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      handleAvatarUpload(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative h-24 w-24">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.username}'s avatar`}
                        className="ring-border h-24 w-24 rounded-full object-cover ring-2"
                        onError={e => {
                          // Fallback to icon if image fails to load
                          e.currentTarget.style.display = "none";
                          const nextElement = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`bg-muted ring-border flex h-24 w-24 items-center justify-center rounded-full ring-2 ${
                        user.avatar ? "hidden" : "flex"
                      }`}
                    >
                      <User className="text-muted-foreground h-12 w-12" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                      disabled={isUploadingAvatar}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                    </Button>

                    {user.avatar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarDelete}
                        disabled={isUploadingAvatar}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}

                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm font-medium">
                    Username
                  </Label>
                  <p className="text-lg">{user.username}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm font-medium">
                    Email
                  </Label>
                  <p className="text-lg">{user.email}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm font-medium">
                    Bio
                  </Label>
                  <p className="text-lg">{user.bio || "No bio added yet"}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm font-medium">
                    Member Since
                  </Label>
                  <p className="text-lg">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Input
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL (optional)</Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    type="url"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: user.username || "",
                        email: user.email || "",
                        bio: user.bio || "",
                        avatar: user.avatar || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Statistics</CardTitle>
            <CardDescription>Your performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.rank && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Global Rank
                  </span>
                  <Badge variant="secondary" className="px-3 py-1 text-lg">
                    #{user.rank}
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user.wins}
                  </div>
                  <div className="text-muted-foreground text-sm">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {user.losses}
                  </div>
                  <div className="text-muted-foreground text-sm">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {user.draws}
                  </div>
                  <div className="text-muted-foreground text-sm">Draws</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{user.totalGames}</div>
                  <div className="text-muted-foreground text-sm">
                    Total Games
                  </div>
                </div>
              </div>

              <div className="border-t pt-2 text-center">
                <div className="text-xl font-bold">{user.winRate}%</div>
                <div className="text-muted-foreground text-sm">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
