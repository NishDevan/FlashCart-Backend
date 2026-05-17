-- Test with:
-- wrk -t8 -c200 -d30s -s post_data.lua http://localhost:8080/api/cart/redis
-- wrk -t8 -c200 -d30s -s post_data.lua http://localhost:8080/api/cart/sql

wrk.method = "POST"

wrk.headers["Content-Type"] = "application/json"
wrk.headers["Cookie"] = "token=<TOKEN_JWT_KAMU>"

wrk.body = '{"product_id": "ebcae8d1-0dbe-4f58-bce4-09f3cfe72e87", "qty": 1}'

function response(status, headers, body)
    print(status)
end