<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthorController;
use App\Http\Controllers\VenueController;
use App\Http\Controllers\SeatController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ReservationController;

/*
|--------------------------------------------------------------------------
| Javni routovi
|--------------------------------------------------------------------------
*/

// Autentifikacija (registracija i prijavljivanje)
Route::post('register', [AuthController::class, 'register']);
Route::post('login',    [AuthController::class, 'login']);
Route::post('reset-password',  [AuthController::class, 'resetPassword']); 

// Autori i prostori (javno dostupno)
Route::get('authors',       [AuthorController::class, 'index']);
Route::get('authors/{id}',  [AuthorController::class, 'show']);
Route::get('venues',        [VenueController::class, 'index']);
Route::get('venues/{id}',   [VenueController::class, 'show']);

// Sedišta kao API resurs (samo lista i prikaz)
Route::apiResource('seats', SeatController::class)
     ->only(['index', 'show']);

/*
|--------------------------------------------------------------------------
| Zaštićeni routovi (sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Odjava
    Route::post('logout', [AuthController::class, 'logout']);

    // Lista kupaca (samo administrator)
    Route::get('buyers', [UserController::class, 'index']);

    // Događaji
    Route::get('events',          [EventController::class, 'index']);             // svi događaji
    Route::get('events/my',       [EventController::class, 'showAllOfMyEvents']); // menadžerovi događaji
    Route::get('events/{id}',     [EventController::class, 'show']);              // detalji događaja
    Route::post('events',         [EventController::class, 'store']);             // kreiranje događaja
    Route::put('events/{id}',     [EventController::class, 'update']);            // izmena događaja
    Route::delete('events/{id}',  [EventController::class, 'delete']);            // brisanje događaja
    Route::post('events/{id}/seats', [SeatController::class, 'createForEvent']);   // kreiranje sedišta za događaj

    // Rezervacije
    Route::get('reservations/events',       [ReservationController::class, 'showAllOfOrdersForMyEvents']); // rezervacije za menadžerove događaje
    Route::get('reservations/my',           [ReservationController::class, 'showAllOfMyOrders']);           // moje rezervacije
    Route::post('reservations',             [ReservationController::class, 'store']);                        // kreiranje rezervacije
    Route::patch('reservations/{id}/status',[ReservationController::class, 'updateStatus']);                 // ažuriranje statusa
    Route::delete('reservations/{id}',      [ReservationController::class, 'delete']);                      // otkaz rezervacije
    Route::get('reservations/analytics',    [ReservationController::class, 'analytics']);
});
