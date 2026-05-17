-- Test with:
-- wrk -t8 -c200 -d30s -s cart_tes.lua http://localhost:4000/carts/redis
-- wrk -t8 -c200 -d30s -s cart_tes.lua http://localhost:4000/carts/sql


wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"

wrk.headers["Cookie"] = "token=<GANTI_INI_JADI_TOKEN>"

local product_ids = {
    "5005287f-d4d2-420e-b625-caa3312d123a",
    "520156c5-740e-4b61-b535-04721fa16403",
    "7544efec-a2c3-44ef-9656-b701437e6746",
    "807a8947-4650-4110-8d41-49aabf57d483",
    "8c536bfb-267c-4fdf-9ab4-8eb03c2665f0",
    "e5f4ec79-76f9-4c7b-9c59-731eb82ed2a3",
    "ebcae8d1-0dbe-4f58-bce4-09f3cfe72e87",
    "fca046c7-9c73-46ee-9588-2be04fe32b1c",
    "fffbba09-c084-47c1-a853-1fd7c25fffee"
}

math.randomseed(os.time())


request = function()
    local random_index = math.random(1, #product_ids)
    local selected_product = product_ids[random_index]

    local body = string.format('{"product_id": "%s", "qty": 1}', selected_product)

    return wrk.format(nil, nil, nil, body)
end

response = function(status, headers, body)
    if status ~= 201 then
        print("Gagal! Status Code: " .. status .. " | Body: " .. body)
    end
end
