import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  get():string {
    console.log(localStorage.getItem("token"));
    return localStorage.getItem("token");
  }
  
}