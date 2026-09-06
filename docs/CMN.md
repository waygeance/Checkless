  # Draft Checkless Move Notation (CMN) v1                                                                                                             
                                                                                                                                                       
  ## Summary                                                                                                                                           
                                                                                                                                                       
  Define CMN as a color-aware, globally sequenced coordinate notation. Store both the structured move fields and the server-generated CMN string.      
  Replay continues to use structured data; CMN provides readable logs and exports.                                                                     
                                                                                                                                                       
  Canonical examples:                                                                                                                                  
                                                                                                                                                       
  (1)W:e2_e4                                                                                                                                           
  (2)W:e4_e5                                                                                                                                           
  (3)B:g8_f6                                                                                                                                           
  (4)B:f6xg4                                                                                                                                           
  (5)W:g1_f3                                                                                                                                           
  (17)B:f6xg4#                                                                                                                                         
                                                                                                                                                       
  ## Grammar and Semantics                                                                                                                             
                                                                                                                                                       
  ^\(([1-9][0-9]*)\)(W|B):([a-h][1-8])([_x])([a-h][1-8])(?:_([QRBN]))?(#)?$                                                                            
                                                                                                                                                       
  - (n) is the global accepted-move sequence, starting at 1 with no gaps.                                                                              
  - W or B identifies the moving color; alternating colors are not required.                                                                           
  - from_to represents a non-capturing move.                                                                                                           
  - fromxto represents a capture, including en passant.                                                                                                
  - _Q, _R, _B, or _N represents promotion.                                                                                                            
  - # means the move captured the opposing king and ended the game. It never means check or checkmate.                                                 
  - Piece letters are omitted because the initial FEN and preceding moves identify the moving piece.
  - Resignation, disconnect, abort and administrative termination do not add #; their result remains game metadata.
  - CMN contains ordering, not timing. Existing cooldown and elapsed-time fields remain separate.

  ## Implementation Changes

  - Add notation String to GameMove, alongside the existing sequence, color, coordinates, capture, promotion and FEN fields.
  - Add one server-owned CMN formatter and parser; clients must never submit authoritative notation.
  - Generate CMN only after the engine accepts a move, using the resulting capture/promotion/game-end facts.
  - Persist the notation and structured fields in the same ordered move write.
  - Add a database format constraint in the reviewed migration; enforce deeper semantic consistency in the service.
  - Document the grammar, examples and terminal-result behavior in docs/CMN.md.

  ## Validation and Tests

  - Round-trip normal moves, consecutive same-color moves, captures and every promotion piece.
  - Cover capture-promotion, castling and king-capture #.
  - Reject sequence zero, lowercase colors, invalid squares, missing separators and unsupported promotion pieces.
  - Reject _ when a capture occurred, x when no capture occurred, and # unless the captured piece is a king.
  - Verify stored CMN agrees with the structured database columns.
  - Replay a mixed-color sequence from initialFen and confirm the final FEN.
  - Confirm resignation and disconnect endings do not alter the last move with #.

  ## Assumptions

  - CMN v1 is ASCII and case-sensitive.
  - Whitespace separates CMN tokens in exports but is not part of a token.
  - PostgreSQL structured fields remain the replay authority; persisted CMN is a deterministic readable representation.
  - Promotion grammar supports Q/R/B/N, although the current engine must later be extended beyond automatic queen promotion.