<?php
// database/factories/AuthorFactory.php

namespace Database\Factories;

use App\Models\Author;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuthorFactory extends Factory
{
    // Model koji ova fabrika kreira
    protected $model = Author::class;

    // Definicija podataka za autora
    public function definition()
    {
        // Podešena lista stvarnih izvođača
        static $artists = [
            'The Beatles',
            'Taylor Swift',
            'Ed Sheeran',
            'Beyoncé',
            'Adele',
            'Coldplay',
            'Bob Dylan',
            'Elton John',
            'Lady Gaga',
            'Bruno Mars',
            'Billie Eilish',
            'Rihanna',
            'Kendrick Lamar',
            'Jay-Z',
            'Ariana Grande',
            'Justin Bieber',
            'Eminem',
            'Kanye West',
            'Sam Smith',
            'Dua Lipa',
            'Cardi B',
            'Post Malone',
            'Queen',
            'Michael Jackson',
            'Madonna',
            'Prince',
            'U2',
            'Linkin Park',
            'Foo Fighters',
        ];
        
        $name = $this->faker->unique()->randomElement($artists);
        $imageUrl = null;

        // Pokušaj da se preuzme slika preko Wikipedia API-ja
        try {
            // Upit Wikipedia API-ja za minijaturu slike
            $client = new Client([
                'base_uri' => 'https://en.wikipedia.org',
                'timeout'  => 3.0, // Timeout u sekundama
            ]);

            $response = $client->get('/w/api.php', [
                'query' => [
                    'action'       => 'query',
                    'titles'       => $name,
                    'prop'         => 'pageimages',
                    'format'       => 'json',
                    'pithumbsize'  => 300,
                ],
            ]);

            $json  = json_decode($response->getBody(), true);
            $pages = $json['query']['pages'] ?? [];
            $page  = reset($pages);

            // Dobijamo minijaturu ako postoji
            if (isset($page['thumbnail']['source'])) {
                $imageUrl = $page['thumbnail']['source'];
            }
        } catch (ConnectException | RequestException $e) {
            // Logovanje greške, ali nastavljamo sa rezervnom opcijom
            echo "Wikipedia API error for {$name}: {$e->getMessage()}. Using placeholder instead.\n";
        }

        // Rezervna opcija: placeholder ako nema slike sa Wikipedia-e
        if (!$imageUrl) {
            $imageUrl = "https://via.placeholder.com/300x300.png?text=" . urlencode($name);
        }

        return [
            'name'        => $name,
            'music_genre' => $this->faker->randomElement([
                'Rock','Pop','Jazz','Classical',
                'Hip-Hop','Electronic','Country',
                'Reggae','Metal',
            ]),
            'image_url'   => $imageUrl,
        ];
    }
}
