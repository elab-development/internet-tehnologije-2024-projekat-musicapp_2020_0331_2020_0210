<?php
// Kontroler za autentifikaciju korisnika: registracija, logovanje i odjava

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Registracija novog korisnika i vraćanje tokena + podataka o korisniku.
     */
    public function register(Request $request)
    {
        // Validacija ulaznih podataka iz zahteva
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|string|email|unique:users,email',
            'password'   => 'required|string|min:8|confirmed',
            'role'       => 'required|in:event_manager,buyer,administrator',
            'address'    => 'nullable|string|max:500',
            'phone'      => 'nullable|string|max:50',
            'image_url'  => 'nullable|url',
        ]);

        // Kreiranje novog korisnika u bazi
        $user = User::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => $validated['role'],
            'address'    => $validated['address']   ?? null,
            'phone'      => $validated['phone']     ?? null,
            'image_url'  => $validated['image_url'] ?? null,
        ]);

        // Generisanje API tokena za korisnika
        $token = $user->createToken('auth_token')->plainTextToken;

        // Poruka zavisna od role i akcije
        $message = $this->getRoleSpecificMessage($user->role, 'registered');

        // Vraćanje JSON odgovora sa podacima i tokenom
        return response()->json([
            'message'   => $message,
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'imageUrl'  => $user->image_url,
            'token'     => $token,
        ], 201);
    }

    /**
     * Prijava (login) postojećeg korisnika i vraćanje tokena + podataka o korisniku.
     */
    public function login(Request $request)
    {
        // Validacija zahteva
        $validated = $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Provera kredencijala
        if (! Auth::attempt([
            'email'    => $validated['email'],
            'password' => $validated['password']
        ])) {
            // Neuspešna prijava
            return response()->json(['error' => 'Invalid login credentials! ⚠️'], 401);
        }

        // Uzimamo prijavljenog korisnika
        $user = Auth::user();
        // Generišemo novi token
        $token = $user->createToken('auth_token')->plainTextToken;
        // Prilagođena poruka
        $message = $this->getRoleSpecificMessage($user->role, 'logged in');

        // Vraćamo JSON odgovor sa podacima i tokenom
        return response()->json([
            'message'   => $message,
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'imageUrl'  => $user->image_url,
            'token'     => $token,
        ]);
    }

    /**
     * Odjava korisnika (revoke svih tokena).
     */
    public function logout(Request $request)
    {
        // Uzimamo trenutno prijavljenog korisnika
        $user = $request->user();
        // Brišemo sve njegove token-e
        $user->tokens()->delete();

        // Prilagođena poruka za odjavu
        $message = $this->getRoleSpecificMessage($user->role, 'logged out');

        // Vraćamo odgovor sa porukom
        return response()->json(['message' => $message]);
    }

    /**
     * Pomoćna metoda koja vraća poruke zavisno od role i akcije.
     */
    private function getRoleSpecificMessage(string $role, string $action): string
    {
        // Definicija poruka za svaku rolu i akciju
        $roleMessages = [
            'buyer' => [
                'registered' => 'Welcome, valued buyer! Your account has been successfully created. 🎉',
                'logged in'  => 'Hello, buyer! You are now logged in. 🛒',
                'logged out' => 'Goodbye, buyer! See you again soon! 👋',
            ],
            'event_manager' => [
                'registered' => 'Welcome, manager! You can now create and manage events. 🎫',
                'logged in'  => 'Hello, manager! Ready to oversee your events? 🏟️',
                'logged out' => 'Goodbye, manager! Your events are safe with us. 👋',
            ],
            'administrator' => [
                'registered' => 'Welcome, administrator! You now have access to manage the platform. 🛠️',
                'logged in'  => 'Hello, administrator! Ready to oversee the platform? 🔧',
                'logged out' => 'Goodbye, administrator! Take care. 👋',
            ],
        ];

        // Vraćamo odgovarajuću poruku ili generičku ako nema definisane
        return $roleMessages[$role][$action] ?? 'Action completed successfully.';
    }

    /**
     * Simple password reset by email.
     * NOTE: This is intentionally simple for dev/demo: no email link/token.
     * It resets password if the email exists and revokes existing tokens.
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Return generic 200 to avoid email enumeration
        if (! $user) {
            return response()->json([
                'message' => 'If the email exists, the password has been reset. Please try logging in.'
            ], 200);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        // Optional: revoke all existing tokens so old sessions are logged out
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Password reset successful. Please log in with your new credentials.'
        ], 200);
    }
}
