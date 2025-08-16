<?php
// database/seeders/UsersSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run()
    {
        // 1 administrator sa fiksnim kredencijalima
        User::factory()->create([
            'name'            => 'Administrator',
            'email'           => 'administrator123@gmail.com',
            'password'        => bcrypt('administrator123'),
            'role'            => 'administrator',
            'address'         => fake()->address(),
            'phone'           => fake()->phoneNumber(),
            'image_url'       => "https://www.shutterstock.com/image-photo/smiling-young-middle-eastern-man-600nw-2063524544.jpg",
            'remember_token'  => Str::random(10),
        ]);

        // 2 menadzera dogadjaja
        User::factory()
            ->count(2)
            ->state(['role' => 'event_manager'])
            ->create();

        // 5 kupaca
        User::factory()
            ->count(5)
            ->state(['role' => 'buyer'])
            ->create();
    }
}
