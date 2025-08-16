<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * GET /reservations/events
     * Prikazuje sve rezervacije za događaje kojima upravlja prijavljeni menadžer.
     */
    public function showAllOfOrdersForMyEvents()
    {
        // Uzimamo trenutno prijavljenog korisnika
        $user = Auth::user();
        // Ako nije menadžer, zabranjujemo pristup
        if ($user->role !== 'event_manager') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Učitavamo rezervacije zajedno sa korisnikom, događajem i sedištima
        $reservations = Reservation::with(['user', 'event', 'seats'])
            ->whereHas('event', fn($q) => $q->where('manager_id', $user->id))
            ->get();

        // Vraćamo kolekciju resursa
        return ReservationResource::collection($reservations);
    }

    /**
     * GET /reservations/my
     * Prikazuje sve rezervacije koje je napravio prijavljeni kupac.
     */
    public function showAllOfMyOrders()
    {
        try {
            // Uzimamo trenutno prijavljenog korisnika
            $user = Auth::user();

            // Provera autentifikacije
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Provera da li je kupac
            if ($user->role !== 'buyer') {
                return response()->json([
                    'message'   => 'Forbidden - Only buyers can view their reservations',
                    'user_role' => $user->role
                ], 403);
            }

            // Učitavamo rezervacije sa povezanim događajem, lokacijom, autorom, menadžerom i sedištima
            $reservations = Reservation::with(['event', 'event.venue', 'event.author', 'event.manager', 'seats'])
                ->where('user_id', $user->id)
                ->get();

            // Vraćamo kolekciju resursa
            return ReservationResource::collection($reservations);

        } catch (\Exception $e) {
            // U slučaju greške vraćamo poruku i detalje
            return response()->json([
                'message' => 'An error occurred while fetching your reservations',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /reservations
     * Kreira novu rezervaciju (samo kupac).
     */
    public function store(Request $request)
    {
        // Uzimamo prijavljenog korisnika
        $user = Auth::user();
        // Provera da li je kupac
        if ($user->role !== 'buyer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Validacija ulaznih podataka
        $data = $request->validate([
            'event_id'   => 'required|exists:events,id',
            'seats'      => 'required|array|min:1',
            'seats.*'    => 'exists:seats,id',
        ]);

        // Broj rezervisanih sedišta
        $number_of_seats = count($data['seats']);
        $event_id        = $data['event_id'];

        // Počinjemo transakciju
        DB::beginTransaction();

        try {
            // Kreiramo rezervaciju
            $reservation = Reservation::create([
                'user_id'         => $user->id,
                'event_id'        => $event_id,
                'number_of_seats' => $number_of_seats,
                'status'          => 'pending',
            ]);

            // Povezujemo sedišta sa rezervacijom
            $reservation->seats()->attach($data['seats']);

            // Povećavamo broj rezervisanih karata na događaju
            Event::where('id', $event_id)
                ->increment('tickets_reserved', $number_of_seats);

            // Potvrđujemo transakciju
            DB::commit();
        } catch (\Exception $e) {
            // U slučaju greške vraćamo nazad i rollback
            DB::rollBack();
            return response()->json(['message' => 'Could not create reservation. Please try again.'], 500);
        }

        // Učitavamo relacije radi odgovora
        $reservation->load(['event', 'seats', 'user']);

        // Vraćamo novi resurs rezervacije
        return new ReservationResource($reservation);
    }

    /**
     * PATCH /reservations/{id}/status
     * Ažurira status rezervacije (samo menadžer događaja).
     */
    public function updateStatus(Request $request, $id)
    {
        // Uzimamo prijavljenog korisnika
        $user = Auth::user();

        // Pronalaženje rezervacije ili 404
        $reservation = Reservation::findOrFail($id);

        // Provera autorizacije: samo menadžer vlasnik događaja
        if ($user->role !== 'event_manager' || $reservation->event->manager_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Validacija novog statusa
        $data = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled',
        ]);

        // Ako otkazujemo, smanjujemo broj rezervisanih karata na događaju
        if ($data['status'] === 'cancelled' && $reservation->status !== 'cancelled') {
            Event::where('id', $reservation->event_id)
                ->decrement('tickets_reserved', $reservation->number_of_seats);
        }
        // Ako ponovo potvrđujemo, povećavamo broj rezervisanih karata
        else if ($data['status'] !== 'cancelled' && $reservation->status === 'cancelled') {
            Event::where('id', $reservation->event_id)
                ->increment('tickets_reserved', $reservation->number_of_seats);
        }

        // Ažuriramo status rezervacije
        $reservation->update(['status' => $data['status']]);
        $reservation->load(['user', 'event', 'seats']);

        // Vraćamo ažurirani resurs
        return new ReservationResource($reservation);
    }

    /**
     * DELETE /reservations/{id}
     * Otkazivanje rezervacije (samo kupac).
     */
    public function delete(Request $request, $id)
    {
        // Uzimamo prijavljenog korisnika
        $user = Auth::user();

        // Pronalaženje rezervacije ili 404
        $reservation = Reservation::findOrFail($id);

        // Provera autorizacije: samo kupac koji je napravio rezervaciju
        if ($user->role !== 'buyer' || $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Broj sedišta za rollback
        $number_of_seats = $reservation->number_of_seats;
        $event_id        = $reservation->event_id;

        // Počinjemo transakciju
        DB::beginTransaction();

        try {
            // Brišemo rezervaciju
            $reservation->delete();

            // Ako nije već bila otkazana, smanjujemo broj rezervisanih karata
            if ($reservation->status !== 'cancelled') {
                Event::where('id', $event_id)
                    ->decrement('tickets_reserved', $number_of_seats);
            }

            // Potvrđujemo transakciju
            DB::commit();
        } catch (\Exception $e) {
            // Rollback u slučaju greške
            DB::rollBack();
            return response()->json(['message' => 'Could not delete reservation. Please try again.'], 500);
        }

        // Vraćamo poruku o uspešnom brisanju
        return response()->json([
            'message' => 'Reservation deleted successfully!'
        ], 200);
    }

    public function analytics(Request $request)
    {
        $user = $request->user();

        // Baza upita po ulozi
        $builder = Reservation::query();
        if ($user->role === 'event_manager') {
            $eventIds = Event::where('manager_id', $user->id)->pluck('id');
            $builder->whereIn('event_id', $eventIds);
        } elseif ($user->role === 'buyer') {
            $builder->where('user_id', $user->id);
        }
        // administrator i ostali (ako postoji) → bez dodatnog filtera

        // 1) Rezervacije po danu (YYYY-MM-DD)
        $perDay = (clone $builder)
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 2) Po statusu
        $byStatus = (clone $builder)
            ->selectRaw("LOWER(status) as status, COUNT(*) as count")
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        return response()->json([
            'per_day'   => $perDay,
            'by_status' => $byStatus,
        ]);
    }
}
