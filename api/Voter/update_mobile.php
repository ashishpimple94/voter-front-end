<?php
/**
 * Update Mobile Number API
 * This endpoint updates the mobile number for a voter
 * 
 * POST Request Body:
 * {
 *   "voter_id": 123,
 *   "epic_id": "ABC123456",
 *   "mobile": "9876543210",
 *   "serial_no": "001"
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Mobile number updated successfully",
 *   "data": {
 *     "voter_id": 123,
 *     "mobile": "9876543210"
 *   }
 * }
 */

// CRITICAL: Prevent WordPress from loading and interfering
// Start output buffering to prevent any WordPress output
ob_start();
ob_clean();

// Set headers BEFORE any output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed. Use POST method.'
    ]);
    exit();
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate input
    if (!$data) {
        throw new Exception('Invalid JSON input');
    }
    
    // Required fields validation (only epic_id is required)
    if (!isset($data['epic_id']) || empty(trim($data['epic_id']))) {
        throw new Exception("Missing required field: epic_id");
    }
    
    $epicId = trim($data['epic_id']);
    $mobile = isset($data['mobile']) ? trim($data['mobile']) : '';
    $address = isset($data['address']) ? trim($data['address']) : (isset($data['house_number']) ? trim($data['house_number']) : '');
    $serialNo = isset($data['serial_no']) ? trim($data['serial_no']) : null;
    $voterId = isset($data['voter_id']) ? intval($data['voter_id']) : null;
    
    // Validate mobile number format (10 digits) - only if mobile is provided
    if ($mobile !== '' && !preg_match('/^\d{10}$/', $mobile)) {
        throw new Exception('Invalid mobile number format. Must be 10 digits or empty.');
    }
    
    // Database connection - UPDATE THESE VALUES WITH YOUR DATABASE CREDENTIALS
    $host = 'localhost'; // Your database host
    $dbname = 'your_database_name'; // Your database name
    $username = 'your_db_username'; // Your database username
    $password = 'your_db_password'; // Your database password
    
    // Uncomment and configure the database connection below
    /*
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Prepare update query
    // Adjust table name and column names according to your database structure
    $sql = "UPDATE voters SET 
            mobile_number = :mobile,";
    
    // Add address/house_number update if provided
    if ($address !== '') {
        $sql .= " house_number = :address,";
    }
    
    $sql .= " updated_at = NOW()
            WHERE epic_id = :epic_id";
    
    // If serial_no is provided, use it as additional identifier
    if ($serialNo) {
        $sql .= " AND serial_number = :serial_no";
    }
    
    $stmt = $pdo->prepare($sql);
    $params = [
        ':mobile' => $mobile,
        ':epic_id' => $epicId
    ];
    
    // Add address parameter if provided
    if ($address !== '') {
        $params[':address'] = $address;
    }
    
    if ($serialNo) {
        $params[':serial_no'] = $serialNo;
    }
    
    $stmt->execute($params);
    
    // Check if any row was updated
    if ($stmt->rowCount() === 0) {
        throw new Exception('No voter found with the provided EPIC ID');
    }
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Mobile number updated successfully',
        'data' => [
            'epic_id' => $epicId,
            'mobile' => $mobile,
            'updated_at' => date('Y-m-d H:i:s')
        ]
    ]);
    */
    
    // TEMPORARY: For testing without database
    // Remove this section once database is configured
    $response = [
        'status' => 'success',
        'message' => 'Voter data update simulated (database not configured)',
        'data' => [
            'epic_id' => $epicId,
            'mobile' => $mobile,
            'address' => $address,
            'updated_at' => date('Y-m-d H:i:s'),
            'note' => 'Please configure database connection in update_mobile.php'
        ]
    ];
    
} catch (PDOException $e) {
    http_response_code(500);
    $response = [
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ];
} catch (Exception $e) {
    http_response_code(400);
    $response = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// CRITICAL: Clean output buffer and send clean JSON response
ob_clean();
echo json_encode($response);
ob_end_flush();
exit();
?>


