export interface User {
  user_id: number;
  email: string;
  plan: string;
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem("clodev_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User) {
  localStorage.setItem("clodev_user", JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem("clodev_user");
}
