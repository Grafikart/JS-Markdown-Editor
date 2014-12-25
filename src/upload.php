<?php
/**
 * This is for demo purpose, copy this code on your website will make it explode !
**/s

header('Content-Type: application/json');
$file = '1.jpg';
move_uploaded_file($_FILES['image']['tmp_name'], $file);
$results = array(
  'id' => basename($file),
  'url'=> $file
);

/**
 * Your upload must return a json {id: XX, url: full_image_url} or an string error with a status code != 200
 */
header('Content-Type: application/json');
echo json_encode($results);
