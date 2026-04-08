<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'METHOD_NOT_ALLOWED',
            'message' => 'POSTメソッドで送信してください'
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INVALID_JSON',
            'message' => 'JSON形式が不正です'
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$birthDate = trim((string)($data['birthDate'] ?? ''));
$birthTime = trim((string)($data['birthTime'] ?? ''));
$birthPlace = trim((string)($data['birthPlace'] ?? ''));

if ($birthDate === '' || $birthTime === '' || $birthPlace === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INVALID_INPUT',
            'message' => '生年月日・出生時刻・出生地をすべて入力してください'
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 今は仮データを返す
 * 後でここを Swiss Ephemeris の実計算処理に差し替える
 */
$response = [
    'success' => true,
    'data' => [
        'sun' => [
            'label' => '太陽',
            'sign' => 'やぎ座',
            'signIndex' => 9,
            'degree' => 13,
            'minute' => 20,
            'longitude' => 283.3333
        ],
        'moon' => [
            'label' => '月',
            'sign' => 'しし座',
            'signIndex' => 4,
            'degree' => 15,
            'minute' => 5,
            'longitude' => 135.0833
        ],
        'mercury' => [
            'label' => '水星',
            'sign' => 'みずがめ座',
            'signIndex' => 10,
            'degree' => 2,
            'minute' => 41,
            'longitude' => 302.6833
        ],
        'venus' => [
            'label' => '金星',
            'sign' => 'いて座',
            'signIndex' => 8,
            'degree' => 29,
            'minute' => 11,
            'longitude' => 269.1833
        ],
        'jupiter' => [
            'label' => '木星',
            'sign' => 'うお座',
            'signIndex' => 11,
            'degree' => 4,
            'minute' => 50,
            'longitude' => 334.8333
        ],
        'saturn' => [
            'label' => '土星',
            'sign' => 'おうし座',
            'signIndex' => 1,
            'degree' => 10,
            'minute' => 3,
            'longitude' => 40.05
        ],
        'uranus' => [
            'label' => '天王星',
            'sign' => 'みずがめ座',
            'signIndex' => 10,
            'degree' => 12,
            'minute' => 44,
            'longitude' => 312.7333
        ],
        'neptune' => [
            'label' => '海王星',
            'sign' => 'みずがめ座',
            'signIndex' => 10,
            'degree' => 1,
            'minute' => 8,
            'longitude' => 301.1333
        ],
        'pluto' => [
            'label' => '冥王星',
            'sign' => 'いて座',
            'signIndex' => 8,
            'degree' => 9,
            'minute' => 55,
            'longitude' => 249.9167
        ],
        'asc' => [
            'label' => 'アセンダント',
            'sign' => 'おひつじ座',
            'signIndex' => 0,
            'degree' => 18,
            'minute' => 12,
            'longitude' => 18.2
        ],
        'mc' => [
            'label' => 'MC',
            'sign' => 'やぎ座',
            'signIndex' => 9,
            'degree' => 6,
            'minute' => 30,
            'longitude' => 276.5
        ],
        'node' => [
            'label' => 'ノード',
            'sign' => 'ふたご座',
            'signIndex' => 2,
            'degree' => 22,
            'minute' => 10,
            'longitude' => 82.1667
        ]
    ],
    'meta' => [
        'birthDate' => $birthDate,
        'birthTime' => $birthTime,
        'birthPlace' => $birthPlace,
        'source' => 'mock'
    ]
];

http_response_code(200);
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);