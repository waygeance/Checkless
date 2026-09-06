  Remaining backend work before a complete V1:                                                                                                         

  1. Finish game lifecycle                                                                                                                             
                                                                                                                                                       
  - Resignation event                                                                                                                                  
  - Proper 10-second reconnect/reclaim window
  - Disconnect forfeiture only after the reclaim window expires
  - Idempotent finalization for all endings
  - Statistics updates during finalization                                                                                                             

  2. Guest identity                                                                                                                                    

  - Signed guest tokens                                                                                                                                
  - Guest matchmaking
  - Guest game persistence
  - Guest reconnect identity validation                                                                                                                
                                                                                                                                                       
  3. Public game/history APIs                                                                                                                          
                                                                                                                                                       
  - GET /api/games/:gameId                                                                                                                             
  - GET /api/games/:gameId/moves                                                                                                                       
  - Public completed-game history                                                                                                                      
  - Replay service using initialFen, ordered moves, and elapsed time
  - Public player profiles and game lists
                                                                                                                                                       
  4. Spectating                                                                                                                                        

  - spectate_game                                                                                                                                      
  - leave_spectating                                                                                                                                   
  - Read-only live game rooms
  - Spectator permission isolation
                                                                                                                                                       
  5. Friends and blocks                                                                                                                                
                                                                                                                                                       
  - Username search                                                                                                                                    
  - Friend requests                                                                                                                                    
  - Accept/decline/cancel/remove friendship                                                                                                            
  - Blocking and unblock operations                                                                                                                    
  - Friend-only presence events                                                                                                                        

  6. Challenges                                                                                                                                        

  - Create challenge                                                                                                                                   
  - Accept challenge                                                                                                                                   
  - Cancel challenge
  - Challenge-code lookup
  - 15-minute expiration                                                                                                                               
  - Atomic opponent claiming                                                                                                                           

  7. Ranked mode and ratings                                                                                                                           
                                                                                                                                                       
  - Ranked matchmaking queues                                                                                                                          
  - Rating-window expansion                                                                                                                            
  - Elo calculation
  - Per-variant statistics                                                                                                                             
  - Exactly-once rating/stat updates                                                                                                                   

  8. Admin moderation                                                                                                                                  

  - Admin user/game search                                                                                                                             
  - Suspend and restore users
  - Mandatory moderation reasons                                                                                                                       
  - Append-only audit records                                                                                                                          
  - Disconnect suspended users
                                                                                                                                                       
  Deferred, not required for the first casual launch:                                                                                                  

  - Tournaments                                                                                                                                        
  - Bots and 30-second bot fallback
  - Multi-instance Redis architecture                                                                                                                  

  The current backend has only the health REST route; most functionality is currently Socket.IO-based. The best next atomic backend feature is:        
                                                                                                                                                       
  > Finish Phase 3: resignation, statistics finalization, and the 10-second reconnect window.                                                          
                                                                                                                                                       
  After that, implement public game/history APIs and spectating. Only then will the backend support the full frontend dashboard, profiles, history,    
  replay, friends, and game-watching experience.