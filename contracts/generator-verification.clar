;; Generator Verification Contract
;; Validates legitimate clean energy producers

(define-data-var admin principal tx-sender)

;; Map of verified generators
(define-map verified-generators principal
  {
    name: (string-utf8 100),
    location: (string-utf8 100),
    capacity: uint,
    technology-type: (string-utf8 50),
    verified: bool
  }
)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-ALREADY-VERIFIED u101)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Register a new generator
(define-public (register-generator (name (string-utf8 100)) (location (string-utf8 100)) (capacity uint) (technology-type (string-utf8 50)))
  (begin
    (asserts! (not (default-to false (get verified (map-get? verified-generators tx-sender)))) (err ERR-ALREADY-VERIFIED))
    (ok (map-set verified-generators tx-sender
      {
        name: name,
        location: location,
        capacity: capacity,
        technology-type: technology-type,
        verified: false
      }
    ))
  )
)

;; Verify a generator (admin only)
(define-public (verify-generator (generator principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (match (map-get? verified-generators generator)
      generator-data (ok (map-set verified-generators generator
                          (merge generator-data { verified: true })))
      (err u102)
    )
  )
)

;; Check if a generator is verified
(define-read-only (is-verified (generator principal))
  (default-to false (get verified (map-get? verified-generators generator)))
)

;; Get generator details
(define-read-only (get-generator-details (generator principal))
  (map-get? verified-generators generator)
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (var-set admin new-admin))
  )
)
