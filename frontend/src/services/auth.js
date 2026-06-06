const STORAGE_KEY = 'chargeiq_user';

export function login(email, password, role) {
  const user = { email, role, name: email.split('@')[0] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function signup(email, password, role) {
  return login(email, password, role);
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getCurrentUser();
}
